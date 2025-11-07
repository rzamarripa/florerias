import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PaymentMethod from '../models/PaymentMethod.js';
import { Branch } from '../models/Branch.js';
import CashRegister from '../models/CashRegister.js';
import { Storage } from '../models/Storage.js';
import OrderPayment from '../models/OrderPayment.js';
import { emitOrderCreated, emitOrderUpdated, emitOrderDeleted } from '../sockets/orderSocket.js';
import mongoose from 'mongoose';

// Obtener todas las órdenes con filtros y paginación
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      salesChannel,
      clientName,
      orderNumber,
      branchId,
      startDate,
      endDate
    } = req.query;

    // Obtener el ID del usuario autenticado
    const userId = req.user?._id;

    // Buscar todas las sucursales donde el usuario es administrador o gerente
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');
    const branchIds = userBranches.map(branch => branch._id);

    if (branchIds.length === 0) {
      // Si el usuario no administra ni gestiona ninguna sucursal, retornar vacío
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }

    // Construir filtros
    const filters = {
      branchId: { $in: branchIds } // Filtrar solo órdenes de sucursales donde el usuario es administrador o gerente
    };

    if (status) {
      filters.status = status;
    }

    if (salesChannel) {
      filters.salesChannel = salesChannel;
    }

    if (clientName) {
      filters['clientInfo.name'] = { $regex: clientName, $options: 'i' };
    }

    if (orderNumber) {
      filters.orderNumber = { $regex: orderNumber, $options: 'i' };
    }

    if (branchId) {
      // Si se proporciona branchId específico, verificar que esté en las sucursales del usuario
      const specificBranchId = new mongoose.Types.ObjectId(branchId);
      const isBranchAllowed = branchIds.some(id => id.equals(specificBranchId));

      if (isBranchAllowed) {
        filters.branchId = specificBranchId;
      } else {
        // Si intenta acceder a una sucursal que no administra, retornar vacío
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }
    }

    // Filtros de fecha
    if (startDate || endDate) {
      filters.createdAt = {};

      if (startDate) {
        // Inicio del día (00:00:00)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filters.createdAt.$gte = start;
      }

      if (endDate) {
        // Fin del día (23:59:59)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.createdAt.$lte = end;
      }
    }

    console.log('getAllOrders - Query params:', { startDate, endDate, branchId, status });
    console.log('getAllOrders - Filtros aplicados:', JSON.stringify(filters, null, 2));

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener órdenes con paginación
    const orders = await Order.find(filters)
      .populate('branchId', 'branchName branchCode')
      .populate('cashRegisterId', 'name isOpen')
      .populate('cashier', 'name email')
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation')
      .populate('deliveryData.neighborhoodId', 'name priceDelivery')
      .populate({
        path: 'payments',
        populate: [
          { path: 'paymentMethod', select: 'name abbreviation' },
          { path: 'registeredBy', select: 'name email' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Order.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una orden por ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashRegisterId', 'name isOpen currentBalance')
      .populate('cashier', 'name email')
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation')
      .populate('deliveryData.neighborhoodId', 'name priceDelivery')
      .populate({
        path: 'payments',
        populate: [
          { path: 'paymentMethod', select: 'name abbreviation' },
          { path: 'registeredBy', select: 'name email' }
        ]
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva orden
const createOrder = async (req, res) => {
  try {
    const {
      branchId,
      cashRegisterId,
      storageId,
      clientInfo,
      salesChannel,
      items,
      shippingType,
      anonymous,
      quickSale,
      deliveryData,
      paymentMethod,
      discount,
      discountType,
      subtotal,
      total,
      advance,
      paidWith,
      change,
      remainingBalance,
      sendToProduction
    } = req.body;

    // Validar campos requeridos
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'La sucursal es obligatoria'
      });
    }

    if (!storageId) {
      return res.status(400).json({
        success: false,
        message: 'El almacén es obligatorio'
      });
    }

    // Validar que la sucursal exista y esté activa
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    if (!branch.isActive) {
      return res.status(400).json({
        success: false,
        message: 'La sucursal no está activa'
      });
    }

    if (!clientInfo || !clientInfo.name) {
      return res.status(400).json({
        success: false,
        message: 'La información del cliente es obligatoria'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe haber al menos un producto en la orden'
      });
    }

    // Validar deliveryData
    if (!deliveryData || !deliveryData.recipientName || !deliveryData.deliveryDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Los datos de entrega (nombre de quien recibe y fecha/hora) son obligatorios'
      });
    }

    // Validar que el método de pago exista
    if (paymentMethod) {
      const paymentMethodExists = await PaymentMethod.findById(paymentMethod);
      if (!paymentMethodExists) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }
    }

    // Validar que el almacén exista
    const storage = await Storage.findById(storageId);
    if (!storage) {
      return res.status(404).json({
        success: false,
        message: 'Almacén no encontrado'
      });
    }

    // Validar que el almacén corresponda a la sucursal
    if (storage.branch.toString() !== branchId) {
      return res.status(400).json({
        success: false,
        message: 'El almacén no pertenece a la sucursal seleccionada'
      });
    }

    // Validar que los productos del catálogo existan y haya stock disponible
    for (const item of items) {
      // Solo validar si es un producto del catálogo
      if (item.isProduct === true) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }

        // Verificar stock en el almacén
        const productInStorage = storage.products.find(
          (p) => p.productId.toString() === item.productId
        );

        if (!productInStorage) {
          return res.status(400).json({
            success: false,
            message: `El producto "${item.productName}" no está disponible en el almacén`
          });
        }

        if (productInStorage.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para "${item.productName}". Disponible: ${productInStorage.quantity}, Solicitado: ${item.quantity}`
          });
        }
      } else {
        // Para productos manuales, asegurarse de que tengan nombre
        if (!item.productName) {
          return res.status(400).json({
            success: false,
            message: 'Los productos manuales deben tener un nombre'
          });
        }
      }
    }

    // Validar que haya un usuario autenticado
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Crear nueva orden
    const newOrder = new Order({
      branchId,
      cashRegisterId: cashRegisterId || null,
      cashier: req.user._id, // Guardar el ID del usuario (cajero) que crea la orden
      clientInfo,
      salesChannel: salesChannel || 'tienda',
      items,
      shippingType: shippingType || 'tienda',
      anonymous: anonymous || false,
      quickSale: quickSale || false,
      deliveryData: {
        recipientName: deliveryData.recipientName,
        deliveryDateTime: deliveryData.deliveryDateTime,
        message: deliveryData.message || '',
        street: deliveryData.street || null,
        neighborhoodId: deliveryData.neighborhoodId || null,
        deliveryPrice: deliveryData.deliveryPrice || 0,
        reference: deliveryData.reference || null
      },
      paymentMethod: paymentMethod,
      discount: discount || 0,
      discountType: discountType || 'porcentaje',
      subtotal,
      total,
      advance: advance || 0,
      paidWith: paidWith || 0,
      change: change || 0,
      remainingBalance: remainingBalance || 0,
      payments: [],
      sendToProduction: sendToProduction || false
    });

    const savedOrder = await newOrder.save();

    // Variable para guardar el ID del pago (si se crea uno)
    let savedPaymentId = null;

    // Si hay un anticipo (advance > 0), crear el registro en OrderPayment
    if (advance && advance > 0 && cashRegisterId) {
      const orderPayment = new OrderPayment({
        orderId: savedOrder._id,
        amount: advance,
        paymentMethod: paymentMethod,
        cashRegisterId: cashRegisterId,
        date: new Date(),
        registeredBy: req.user?._id || null,
        notes: 'Pago inicial al crear la orden'
      });

      const savedPayment = await orderPayment.save();
      savedPaymentId = savedPayment._id;

      // Agregar la referencia del pago a la orden
      savedOrder.payments.push(savedPayment._id);
      await savedOrder.save();
    }

    // Descontar productos del almacén
    for (const item of items) {
      // Solo descontar si es un producto del catálogo
      if (item.isProduct === true && item.productId) {
        const productInStorageIndex = storage.products.findIndex(
          (p) => p.productId.toString() === item.productId
        );

        if (productInStorageIndex !== -1) {
          storage.products[productInStorageIndex].quantity -= item.quantity;

          // Si la cantidad llega a 0, remover el producto del array
          if (storage.products[productInStorageIndex].quantity === 0) {
            storage.products.splice(productInStorageIndex, 1);
          }
        }
      }
    }

    // Actualizar fecha de último egreso y guardar el almacén
    storage.lastOutcome = Date.now();
    await storage.save();

    // Si hay caja registradora asignada, actualizar su balance
    if (cashRegisterId && advance > 0) {
      try {
        // Agregar el monto del anticipo a la caja y registrar la orden con su pago
        await CashRegister.findByIdAndUpdate(
          cashRegisterId,
          {
            $inc: { currentBalance: advance },
            $push: {
              lastRegistry: {
                orderId: savedOrder._id,
                paymentIds: savedPaymentId ? [savedPaymentId] : [], // Agregar el ID del pago en el array
                saleDate: new Date()
              }
            }
          }
        );
      } catch (cashRegisterError) {
        console.error('Error al actualizar caja registradora:', cashRegisterError);
        // No fallar la orden si hay error al actualizar la caja
      }
    }

    // Popular la orden guardada antes de devolverla
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashRegisterId', 'name isOpen currentBalance')
      .populate('cashier', 'name email')
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation')
      .populate('deliveryData.neighborhoodId', 'name priceDelivery')
      .populate({
        path: 'payments',
        populate: [
          { path: 'paymentMethod', select: 'name abbreviation' },
          { path: 'registeredBy', select: 'name email' }
        ]
      });

    // Emitir evento de socket para notificar a otros usuarios
    emitOrderCreated(populatedOrder);

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Orden creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear orden:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar una orden
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si la orden existe
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Si se actualizan items, validar según tipo de producto
    if (updateData.items && updateData.items.length > 0) {
      for (const item of updateData.items) {
        // Solo validar si es un producto del catálogo
        if (item.isProduct === true) {
          const product = await Product.findById(item.productId);
          if (!product) {
            return res.status(404).json({
              success: false,
              message: `Producto con ID ${item.productId} no encontrado`
            });
          }
        } else {
          // Para productos manuales, asegurarse de que tengan nombre
          if (!item.productName) {
            return res.status(400).json({
              success: false,
              message: 'Los productos manuales deben tener un nombre'
            });
          }
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('branchId', 'branchName branchCode')
      .populate('cashRegisterId', 'name isOpen currentBalance')
      .populate('cashier', 'name email')
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation')
      .populate('deliveryData.neighborhoodId', 'name priceDelivery')
      .populate({
        path: 'payments',
        populate: [
          { path: 'paymentMethod', select: 'name abbreviation' },
          { path: 'registeredBy', select: 'name email' }
        ]
      });

    // Emitir evento de socket para notificar a otros usuarios
    emitOrderUpdated(updatedOrder);

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Orden actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar orden:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar estado de orden
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const validStatuses = ['pendiente', 'en-proceso', 'completado', 'cancelado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('branchId', 'branchName branchCode')
      .populate('cashRegisterId', 'name isOpen currentBalance')
      .populate('cashier', 'name email')
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation')
      .populate('deliveryData.neighborhoodId', 'name priceDelivery')
      .populate({
        path: 'payments',
        populate: [
          { path: 'paymentMethod', select: 'name abbreviation' },
          { path: 'registeredBy', select: 'name email' }
        ]
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Emitir evento de socket para notificar a otros usuarios
    emitOrderUpdated(order);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Estado de orden actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una orden
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Emitir evento de socket para notificar a otros usuarios
    const branchId = deletedOrder.branchId?._id || deletedOrder.branchId;
    emitOrderDeleted(id, branchId);

    res.status(200).json({
      success: true,
      message: 'Orden eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener resumen de ventas (estadísticas)
const getOrdersSummary = async (req, res) => {
  try {
    const {
      branchId,
      startDate,
      endDate
    } = req.query;

    // Obtener el ID del usuario autenticado
    const userId = req.user?._id;

    // Buscar todas las sucursales donde el usuario es administrador o gerente
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');
    const branchIds = userBranches.map(branch => branch._id);

    if (branchIds.length === 0) {
      // Si el usuario no administra ni gestiona ninguna sucursal, retornar estadísticas vacías
      return res.status(200).json({
        success: true,
        data: {
          totalSales: { count: 0, amount: 0 },
          pendingPayment: { count: 0, amount: 0 },
          paidSales: { count: 0, amount: 0 },
          cancelledSales: { count: 0, amount: 0 }
        }
      });
    }

    // Construir filtros base
    const filters = {
      branchId: { $in: branchIds } // Filtrar solo órdenes de sucursales donde el usuario es administrador o gerente
    };

    if (branchId) {
      // Si se proporciona branchId específico, verificar que esté en las sucursales del usuario
      const specificBranchId = new mongoose.Types.ObjectId(branchId);
      const isBranchAllowed = branchIds.some(id => id.equals(specificBranchId));

      if (isBranchAllowed) {
        filters.branchId = specificBranchId;
      } else {
        // Si intenta acceder a una sucursal que no administra, retornar estadísticas vacías
        return res.status(200).json({
          success: true,
          data: {
            totalSales: { count: 0, amount: 0 },
            pendingPayment: { count: 0, amount: 0 },
            paidSales: { count: 0, amount: 0 },
            cancelledSales: { count: 0, amount: 0 }
          }
        });
      }
    }

    // Filtros de fecha
    if (startDate || endDate) {
      filters.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filters.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.createdAt.$lte = end;
      }
    }

    console.log('getOrdersSummary - Filtros aplicados:', JSON.stringify(filters, null, 2));

    // Obtener todas las órdenes que cumplen con los filtros
    const allOrders = await Order.find(filters);

    // Calcular estadísticas
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);

    // Ventas pendientes de pago (remainingBalance > 0)
    const pendingPaymentOrders = allOrders.filter(order => order.remainingBalance > 0);
    const pendingPaymentCount = pendingPaymentOrders.length;
    const pendingPaymentAmount = pendingPaymentOrders.reduce((sum, order) => sum + order.remainingBalance, 0);

    // Ventas pagadas (remainingBalance === 0)
    const paidOrders = allOrders.filter(order => order.remainingBalance === 0);
    const paidOrdersCount = paidOrders.length;
    const paidOrdersAmount = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // Ventas canceladas
    const cancelledOrders = allOrders.filter(order => order.status === 'cancelado');
    const cancelledOrdersCount = cancelledOrders.length;
    const cancelledOrdersAmount = cancelledOrders.reduce((sum, order) => sum + order.total, 0);

    res.status(200).json({
      success: true,
      data: {
        totalSales: {
          count: totalOrders,
          amount: totalRevenue
        },
        pendingPayment: {
          count: pendingPaymentCount,
          amount: pendingPaymentAmount
        },
        paidSales: {
          count: paidOrdersCount,
          amount: paidOrdersAmount
        },
        cancelledSales: {
          count: cancelledOrdersCount,
          amount: cancelledOrdersAmount
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersSummary
};
