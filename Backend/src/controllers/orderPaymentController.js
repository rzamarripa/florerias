import OrderPayment from '../models/OrderPayment.js';
import Order from '../models/Order.js';
import CashRegister from '../models/CashRegister.js';
import PaymentMethod from '../models/PaymentMethod.js';
import orderLogService from '../services/orderLogService.js';
import mongoose from 'mongoose';
import { emitOrderUpdated } from '../sockets/orderSocket.js';
import { Branch } from '../models/Branch.js';
import { StageCatalog } from '../models/StageCatalog.js';

// Crear un nuevo pago para una orden
export const createOrderPayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, cashRegisterId, registeredBy, notes } = req.body;

    // Validar que la orden existe
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Validar que el monto no exceda el saldo pendiente
    if (amount > order.remainingBalance) {
      return res.status(400).json({
        message: 'El monto del pago excede el saldo pendiente',
        remainingBalance: order.remainingBalance
      });
    }

    // Obtener el método de pago para verificar si es efectivo
    const paymentMethodData = await PaymentMethod.findById(paymentMethod);
    if (!paymentMethodData) {
      return res.status(404).json({ message: 'Método de pago no encontrado' });
    }

    const isEffectivo = paymentMethodData.name.toLowerCase() === 'efectivo';

    // Validar que la caja registradora existe SOLO si el pago es en efectivo
    let cashRegister = null;
    if (isEffectivo) {
      if (!cashRegisterId) {
        return res.status(400).json({ message: 'La caja registradora es requerida para pagos en efectivo' });
      }
      cashRegister = await CashRegister.findById(cashRegisterId);
      if (!cashRegister) {
        return res.status(404).json({ message: 'Caja registradora no encontrada' });
      }
    }

    // Crear el pago (cashRegisterId puede ser null si no es efectivo)
    const payment = new OrderPayment({
      orderId,
      amount,
      paymentMethod,
      cashRegisterId: cashRegisterId || null,
      registeredBy,
      notes,
      date: new Date()
    });

    await payment.save();

    // Guardar el advance anterior para detectar si era 0
    const previousAdvance = order.advance || 0;

    // Actualizar la orden
    order.advance += amount;
    order.remainingBalance -= amount;
    order.payments.push(payment._id);

    // Si la orden no tenía anticipo previo (advance = 0) y no ha sido enviada a producción,
    // enviarla automáticamente a producción cuando reciba el primer pago
    const wasPreviouslyNotSent = !order.sendToProduction;
    if (previousAdvance === 0 && wasPreviouslyNotSent && order.advance > 0) {
      order.sendToProduction = true;
      console.log(`📦 [AutoSend] Orden ${order.orderNumber} enviada a producción automáticamente al recibir primer pago`);
      console.log(`   - Condiciones: previousAdvance=${previousAdvance}, wasPreviouslyNotSent=${wasPreviouslyNotSent}, newAdvance=${order.advance}`);

      // Asignar stage de producción si no tiene uno
      if (!order.stage) {
        try {
          // Obtener la empresa a través de la sucursal
          const branchWithCompany = await Branch.findById(order.branchId).populate('companyId');

          if (branchWithCompany && branchWithCompany.companyId) {
            const companyId = branchWithCompany.companyId._id;

            // Buscar la etapa con stageNumber = 1 y boardType = 'Produccion' para esta empresa
            const firstStage = await StageCatalog.findOne({
              company: companyId,
              stageNumber: 1,
              boardType: 'Produccion',
              isActive: true
            });

            if (firstStage) {
              order.stage = firstStage._id;
              console.log(`   - Stage asignado: ${firstStage.name} (stageNumber: ${firstStage.stageNumber})`);
            } else {
              console.warn(`   - No se encontró stage inicial de Producción para la empresa ${companyId}`);
            }
          }
        } catch (stageError) {
          console.error('Error al asignar stage automáticamente:', stageError);
          // No fallar el pago si hay error al asignar el stage
        }
      }

      // Crear log de envío automático a producción
      try {
        const user = await mongoose.model('cs_user').findById(registeredBy).populate('role');
        await orderLogService.createLog(
          orderId,
          'auto_sent_to_production',
          `Orden enviada automáticamente a producción al recibir primer pago`,
          registeredBy,
          user?.profile?.fullName || user?.name || 'Usuario',
          user?.role?.name || 'Usuario',
          {
            paymentAmount: amount,
            orderNumber: order.orderNumber,
            stageAssigned: order.stage ? true : false
          }
        );
      } catch (logError) {
        console.error('Error al crear log de envío automático:', logError);
      }
    }

    // NO actualizar el status de la orden aunque el saldo llegue a 0
    // El status se mantiene como está (pendiente, en-proceso, etc.)

    await order.save();

    // Actualizar el balance de la caja SOLO si el método de pago es efectivo Y hay caja
    if (isEffectivo && cashRegister) {
      cashRegister.currentBalance += amount;

      // Buscar si ya existe un registro de esta orden en lastRegistry
      const existingRegistryIndex = cashRegister.lastRegistry.findIndex(
        reg => reg.orderId.toString() === orderId.toString()
      );

      if (existingRegistryIndex !== -1) {
        // Si ya existe, agregar el nuevo paymentId al array
        cashRegister.lastRegistry[existingRegistryIndex].paymentIds.push(payment._id);
      } else {
        // Si no existe, crear nuevo registro (aunque normalmente ya debería existir)
        cashRegister.lastRegistry.push({
          orderId: orderId,
          paymentIds: [payment._id],
          saleDate: new Date()
        });
      }

      await cashRegister.save();
    }

    // Obtener el pago con sus referencias pobladas
    const populatedPayment = await OrderPayment.findById(payment._id)
      .populate('paymentMethod')
      .populate('registeredBy')
      .populate('cashRegisterId');

    // Crear log de pago recibido
    try {
      const user = await mongoose.model('cs_user').findById(registeredBy).populate('role');
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(amount);
      };

      await orderLogService.createLog(
        orderId,
        'payment_received',
        `Pago recibido: ${formatCurrency(amount)} - ${paymentMethodData.name}`,
        registeredBy,
        user?.profile?.fullName || user?.name || 'Usuario',
        user?.role?.name || 'Usuario',
        {
          amount,
          paymentMethod: paymentMethodData.name,
          paymentId: payment._id,
          remainingBalance: order.remainingBalance,
          notes: notes || ''
        }
      );
    } catch (logError) {
      console.error('Error al crear log de pago:', logError);
    }

    // Emitir socket para actualización en tiempo real
    try {
      const updatedOrder = await Order.findById(orderId)
        .populate('branchId', 'branchName branchCode')
        .populate('cashRegisterId', 'name isOpen currentBalance')
        .populate('cashier', 'name email')
        .populate('items.productId', 'nombre imagen')
        .populate('clientInfo.clientId', 'name lastName phoneNumber email')
        .populate('paymentMethod', 'name abbreviation')
        .populate('deliveryData.neighborhoodId', 'name priceDelivery')
        .populate('stage', 'name abreviation stageNumber color boardType')
        .populate({
          path: 'payments',
          populate: [
            { path: 'paymentMethod', select: 'name abbreviation' },
            { path: 'registeredBy', select: 'name email' }
          ]
        });

      if (updatedOrder) {
        emitOrderUpdated(updatedOrder);
        console.log(`📡 Socket emitido: Pago recibido para orden ${updatedOrder.orderNumber} - Monto: $${amount}`);
        if (updatedOrder.sendToProduction && updatedOrder.stage) {
          console.log(`   - Orden enviada a producción con stage: ${updatedOrder.stage.name}`);
        }
      }
    } catch (socketError) {
      console.error('Error al emitir socket de actualización de pago:', socketError);
    }

    res.status(201).json({
      message: 'Pago registrado exitosamente',
      payment: populatedPayment,
      order: {
        advance: order.advance,
        remainingBalance: order.remainingBalance
      }
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({ message: 'Error al registrar el pago', error: error.message });
  }
};

// Obtener todos los pagos de una orden específica
export const getOrderPayments = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payments = await OrderPayment.find({ orderId })
      .populate('paymentMethod')
      .populate('registeredBy')
      .populate('cashRegisterId')
      .sort({ date: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error al obtener los pagos', error: error.message });
  }
};

// Obtener un pago específico por ID
export const getOrderPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await OrderPayment.findById(id)
      .populate('orderId')
      .populate('paymentMethod')
      .populate('registeredBy')
      .populate('cashRegisterId');

    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ message: 'Error al obtener el pago', error: error.message });
  }
};

// Eliminar un pago (con reversión de saldos)
export const deleteOrderPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await OrderPayment.findById(id).populate('paymentMethod');
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    // Verificar si el pago fue en efectivo
    const isEffectivo = payment.paymentMethod?.name?.toLowerCase() === 'efectivo';

    // Obtener la orden
    const order = await Order.findById(payment.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Revertir los cambios en la orden
    order.advance -= payment.amount;
    order.remainingBalance += payment.amount;
    order.payments = order.payments.filter(p => p.toString() !== id);
    await order.save();

    // Revertir el cambio en la caja registradora SOLO si el pago fue en efectivo
    const cashRegister = await CashRegister.findById(payment.cashRegisterId);
    if (cashRegister) {
      // Solo revertir el balance si el pago era en efectivo
      if (isEffectivo) {
        cashRegister.currentBalance -= payment.amount;
      }

      // Remover el paymentId del lastRegistry
      const registryIndex = cashRegister.lastRegistry.findIndex(
        reg => reg.orderId.toString() === payment.orderId.toString()
      );

      if (registryIndex !== -1) {
        // Filtrar el paymentId del array
        cashRegister.lastRegistry[registryIndex].paymentIds =
          cashRegister.lastRegistry[registryIndex].paymentIds.filter(
            payId => payId.toString() !== id.toString()
          );
      }

      await cashRegister.save();
    }

    // Eliminar el pago
    await OrderPayment.findByIdAndDelete(id);

    // Crear log de pago eliminado
    try {
      const user = req.user || {};
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(amount);
      };

      await orderLogService.createLog(
        payment.orderId,
        'payment_deleted',
        `Pago eliminado: ${formatCurrency(payment.amount)} - ${payment.paymentMethod?.name || 'N/A'}`,
        user._id,
        user.profile?.fullName || user.name || 'Usuario',
        user.role?.name || 'Usuario',
        {
          amount: payment.amount,
          paymentMethod: payment.paymentMethod?.name,
          paymentId: id,
          remainingBalance: order.remainingBalance
        }
      );
    } catch (logError) {
      console.error('Error al crear log de pago eliminado:', logError);
    }

    // Emitir socket para actualización en tiempo real
    try {
      const updatedOrder = await Order.findById(payment.orderId)
        .populate('branchId', 'branchName branchCode')
        .populate('cashRegisterId', 'name isOpen currentBalance')
        .populate('cashier', 'name email')
        .populate('items.productId', 'nombre imagen')
        .populate('clientInfo.clientId', 'name lastName phoneNumber email')
        .populate('paymentMethod', 'name abbreviation')
        .populate('deliveryData.neighborhoodId', 'name priceDelivery')
        .populate('stage', 'name abreviation stageNumber color boardType')
        .populate({
          path: 'payments',
          populate: [
            { path: 'paymentMethod', select: 'name abbreviation' },
            { path: 'registeredBy', select: 'name email' }
          ]
        });

      if (updatedOrder) {
        emitOrderUpdated(updatedOrder);
        console.log(`📡 Socket emitido: Pago eliminado de orden ${updatedOrder.orderNumber} - Monto: $${payment.amount}`);
      }
    } catch (socketError) {
      console.error('Error al emitir socket de actualización de pago eliminado:', socketError);
    }

    res.status(200).json({
      message: 'Pago eliminado exitosamente',
      order: {
        advance: order.advance,
        remainingBalance: order.remainingBalance
      }
    });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ message: 'Error al eliminar el pago', error: error.message });
  }
};

// Obtener todos los pagos (con filtros opcionales)
export const getAllOrderPayments = async (req, res) => {
  try {
    const { cashRegisterId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (cashRegisterId) {
      query.cashRegisterId = cashRegisterId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const payments = await OrderPayment.find(query)
      .populate('orderId')
      .populate('paymentMethod')
      .populate('registeredBy')
      .populate('cashRegisterId')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await OrderPayment.countDocuments(query);

    res.status(200).json({
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPayments: count
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error al obtener los pagos', error: error.message });
  }
};

// Obtener pagos de órdenes filtrados por sucursal (para finanzas)
export const getOrderPaymentsByBranch = async (req, res) => {
  try {
    const { branchId, startDate, endDate, clientIds, paymentMethods, cashierId } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const User = (await import('../models/User.js')).User;
    const Role = (await import('../models/Roles.js')).Role;
    const Branch = (await import('../models/Branch.js')).Branch;
    const Company = (await import('../models/Company.js')).Company;

    const user = await User.findById(userId).populate('role');
    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene rol asignado'
      });
    }

    const userRole = user.role.name;
    let branchIdsToSearch = [];

    // Construir query para órdenes
    const orderQuery = {};

    // Si se especifica una sucursal específica, usarla
    if (branchId) {
      branchIdsToSearch = [branchId];
    }
    // Si no se especifica sucursal, obtener todas según el rol
    else {
      if (userRole === 'Administrador') {
        // 1. Buscar la empresa donde el usuario es administrator
        const company = await Company.findOne({ administrator: userId });

        if (!company) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró empresa asociada al administrador'
          });
        }

        // 2. Buscar todas las sucursales de esa empresa
        const branches = await Branch.find({
          companyId: company._id,
          isActive: true
        }).select('_id');

        branchIdsToSearch = branches.map(b => b._id);

        console.log(`Admin ${userId} - Company: ${company._id} - Found ${branchIdsToSearch.length} branches`);
      }
      else if (userRole === 'Gerente') {
        // Para gerentes, buscar su sucursal
        const branch = await Branch.findOne({
          manager: userId,
          isActive: true
        }).select('_id');

        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al gerente'
          });
        }

        branchIdsToSearch = [branch._id];
      }
      else if (userRole === 'Cajero') {
        // Para cajeros, buscar su sucursal donde está como empleado
        const branch = await Branch.findOne({
          employees: userId,
          isActive: true
        }).select('_id');

        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al cajero'
          });
        }

        branchIdsToSearch = [branch._id];
      }
      else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver pagos de órdenes'
        });
      }
    }

    // Validar que tengamos sucursales para buscar
    if (branchIdsToSearch.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron sucursales',
        data: []
      });
    }

    // Importar mongoose para conversión de ObjectId
    const mongoose = (await import('mongoose')).default;

    // Convertir branchIdsToSearch a ObjectId
    const branchObjectIds = branchIdsToSearch.map(id =>
      typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
    );

    // Aplicar filtro de sucursales
    if (branchObjectIds.length === 1) {
      orderQuery.branchId = branchObjectIds[0];
    } else {
      orderQuery.branchId = { $in: branchObjectIds };
    }

    // Filtrar por clientes si se especifica
    if (clientIds) {
      const clientIdsArray = Array.isArray(clientIds) ? clientIds : [clientIds];
      orderQuery['clientInfo.clientId'] = { $in: clientIdsArray.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filtrar por cajero si se especifica
    if (cashierId) {
      orderQuery.cashier = new mongoose.Types.ObjectId(cashierId);
    }

    // Para usuarios con rol "Cajero", agregar filtros específicos
    if (userRole === 'Cajero') {
      orderQuery.cashier = userId; // Solo órdenes creadas por el cajero
      orderQuery.isSocialMediaOrder = false; // Solo órdenes que NO son de redes sociales
    }

    console.log('OrderQuery:', JSON.stringify(orderQuery, null, 2));
    console.log('BranchIds:', branchObjectIds.map(id => id.toString()));

    const orders = await Order.find(orderQuery).select('_id branchId cashier');
    const orderIds = orders.map(order => order._id);

    console.log(`Found ${orders.length} orders matching criteria`);
    if (orders.length > 0) {
      console.log('Sample order:', orders[0]);
    }

    // Si no hay órdenes, retornar array vacío
    if (orderIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron órdenes para las sucursales especificadas',
        data: []
      });
    }

    // Ahora buscar los pagos de esas órdenes
    const paymentQuery = {
      orderId: { $in: orderIds }
    };

    // Filtrar por fechas
    if (startDate || endDate) {
      paymentQuery.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        paymentQuery.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        paymentQuery.date.$lte = end;
      }
    }

    // Filtrar por métodos de pago
    if (paymentMethods) {
      const paymentMethodsArray = Array.isArray(paymentMethods) ? paymentMethods : [paymentMethods];
      paymentQuery.paymentMethod = { $in: paymentMethodsArray.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const payments = await OrderPayment.find(paymentQuery)
      .populate({
        path: 'orderId',
        select: 'orderNumber clientInfo branchId',
        populate: {
          path: 'branchId',
          select: 'name'
        }
      })
      .populate('paymentMethod', 'name')
      .populate('registeredBy', 'profile.name profile.lastName profile.fullName')
      .populate('cashRegisterId', 'name')
      .sort({ date: -1 });

    console.log(`Found ${payments.length} payments for ${branchIdsToSearch.length} branches`);

    res.status(200).json({
      success: true,
      message: 'Pagos obtenidos exitosamente',
      data: payments
    });
  } catch (error) {
    console.error('Error al obtener pagos por sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los pagos',
      error: error.message
    });
  }
};
