import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PaymentMethod from '../models/PaymentMethod.js';
import { Branch } from '../models/Branch.js';
import CashRegister from '../models/CashRegister.js';
import { Storage } from '../models/Storage.js';
import OrderPayment from '../models/OrderPayment.js';
import OrderNotification from '../models/OrderNotification.js';
import { Company } from '../models/Company.js';
import { StageCatalog } from '../models/StageCatalog.js';
import DiscountAuth from '../models/DiscountAuth.js';
import { emitOrderCreated, emitOrderUpdated, emitOrderDeleted, emitStockUpdated } from '../sockets/orderSocket.js';
import orderLogService from '../services/orderLogService.js';
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
      endDate,
      paymentMethodId
    } = req.query;

    // Obtener el ID del usuario autenticado
    const userId = req.user?._id;

    // Obtener información del usuario con su rol
    const user = await mongoose.model('cs_user').findById(userId).populate('role');

    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o sin rol asignado'
      });
    }

    const userRole = user.role.name;
    let branchIds = [];

    // Verificar si el usuario tiene rol "Redes"
    if (userRole === 'Redes') {
      // Buscar la empresa donde el usuario está en el array redes
      const userCompany = await Company.findOne({
        redes: userId
      });

      if (!userCompany) {
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

      // Obtener todas las sucursales de la empresa
      const companyBranches = await Branch.find({
        companyId: userCompany._id
      }).select('_id');

      branchIds = companyBranches.map(branch => branch._id);
    } else if (userRole === 'Cajero') {
      // Para cajeros, solo su sucursal donde está como empleado
      const userBranches = await Branch.find({
        employees: userId
      }).select('_id');
      branchIds = userBranches.map(branch => branch._id);
    } else {
      // Lógica existente para Administrador y Gerente
      const userBranches = await Branch.find({
        $or: [
          { administrator: userId },
          { manager: userId },
          { employees: userId }
        ]
      }).select('_id');
      branchIds = userBranches.map(branch => branch._id);
    }

    if (branchIds.length === 0) {
      // Si el usuario no tiene sucursales asignadas, retornar vacío
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

    // Construir filtros base
    const filters = {};

    // Si el usuario tiene sucursales asignadas, filtrar por ellas por defecto
    if (branchIds.length > 0) {
      filters.branchId = { $in: branchIds };
    }

    // Para usuarios con rol "Redes", agregar filtro de redes sociales
    if (userRole === 'Redes') {
      filters.isSocialMediaOrder = true;
    }

    // Para usuarios con rol "Cajero", agregar filtros específicos
    if (userRole === 'Cajero') {
      filters.cashier = userId; // Solo órdenes creadas por el cajero
      filters.isSocialMediaOrder = false; // Solo órdenes que NO son de redes sociales
    }

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

    // Filtrar por método de pago si se proporciona
    if (paymentMethodId) {
      filters.paymentMethod = new mongoose.Types.ObjectId(paymentMethodId);
    }

    // Si se proporciona branchId específico, aplicar ese filtro
    if (branchId) {
      const specificBranchId = new mongoose.Types.ObjectId(branchId);

      // Si el usuario tiene sucursales asignadas, verificar que tenga acceso
      if (branchIds.length > 0) {
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
      } else {
        // Si el usuario no tiene sucursales asignadas pero se proporciona branchId, filtrar por ese
        filters.branchId = specificBranchId;
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
      .populate('stage', 'name abreviation stageNumber color boardType')
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
      .populate('stage', 'name abreviation stageNumber color boardType')
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
      sendToProduction,
      discountRequestMessage
    } = req.body;

    // Validar campos requeridos
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'La sucursal es obligatoria'
      });
    }

    // Validar si hay productos del catálogo (isProduct: true)
    const hasProductsFromCatalog = items && items.some(item => item.isProduct === true);

    // Solo requerir storageId si hay productos del catálogo
    if (hasProductsFromCatalog && !storageId) {
      return res.status(400).json({
        success: false,
        message: 'El almacén es obligatorio cuando se incluyen productos del catálogo'
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

    // Validar que la caja registradora pertenezca a la sucursal seleccionada para usuarios de Redes
    if (cashRegisterId) {
      const cashRegister = await CashRegister.findById(cashRegisterId);

      if (!cashRegister) {
        return res.status(404).json({
          success: false,
          message: 'Caja registradora no encontrada'
        });
      }

      // Validar que la caja pertenezca a la sucursal seleccionada
      if (cashRegister.branchId.toString() !== branchId) {
        return res.status(400).json({
          success: false,
          message: 'La caja registradora no pertenece a la sucursal seleccionada'
        });
      }

      // Validar que la caja esté abierta
      if (!cashRegister.isOpen) {
        return res.status(400).json({
          success: false,
          message: 'La caja registradora debe estar abierta para crear una orden'
        });
      }

      // Para usuarios de Redes, validar que solo usen cajas de redes sociales
      const user = await mongoose.model('cs_user').findById(req.user._id).populate('role');
      if (user && user.role && user.role.name === 'Redes') {
        if (!cashRegister.isSocialMediaBox) {
          return res.status(400).json({
            success: false,
            message: 'Los usuarios de Redes solo pueden usar cajas de redes sociales'
          });
        }
      }
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

    // Validar que el almacén exista solo si se proporcionó storageId
    let storage = null;
    if (storageId) {
      storage = await Storage.findById(storageId);
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
    }

    // Validar que los productos del catálogo existan y haya stock disponible
    for (const item of items) {
      // Validar que todos los productos tengan categoría
      if (!item.productCategory) {
        return res.status(400).json({
          success: false,
          message: `El producto "${item.productName}" debe tener una categoría asignada`
        });
      }

      // Solo validar si es un producto del catálogo
      if (item.isProduct === true) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }

        // Si no hay storage pero hay productos del catálogo, ya se validó arriba
        // Solo verificar stock si hay storage
        if (storage) {
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

    // Extraer campos de redes sociales y descuento del body
    const { isSocialMediaOrder, socialMedia, hasPendingDiscountAuth } = req.body;

    // Extraer todos los materiales extras de los items
    const materials = [];
    items.forEach(item => {
      if (item.insumos && Array.isArray(item.insumos)) {
        item.insumos.forEach(insumo => {
          if (insumo.isExtra === true) {
            materials.push({
              nombre: insumo.nombre,
              cantidad: insumo.cantidad,
              importeVenta: insumo.importeVenta,
              isExtra: true
            });
          }
        });
      }
    });

    // Determinar si enviar a producción automáticamente
    // Si tiene descuento pendiente de autorización, NO enviar a producción aunque tenga anticipo
    // Si hay anticipo (advance > 0) Y NO tiene descuento pendiente, enviar automáticamente a producción
    const shouldSendToProduction = hasPendingDiscountAuth
      ? false
      : ((advance && advance > 0) ? true : (sendToProduction || false));

    // Determinar si se debe asignar una etapa y el status de la orden
    // Asignar etapa si: sendToProduction = true O (advance > 0 Y NO hay descuento pendiente)
    let stageId = null;
    let orderStatus = 'pendiente'; // status por defecto

    if (shouldSendToProduction || (advance && advance > 0 && !hasPendingDiscountAuth)) {
      // Obtener la empresa a través de la sucursal
      const branchWithCompany = await Branch.findById(branchId).populate('companyId');

      if (!branchWithCompany || !branchWithCompany.companyId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo obtener la empresa asociada a la sucursal'
        });
      }

      const companyId = branchWithCompany.companyId._id;

      // Buscar la etapa con stageNumber = 1 y boardType = 'Produccion' para esta empresa
      const firstStage = await StageCatalog.findOne({
        company: companyId,
        stageNumber: 1,
        boardType: 'Produccion',
        isActive: true
      });

      if (!firstStage) {
        return res.status(400).json({
          success: false,
          message: 'No se encontró una etapa inicial de Producción (stageNumber = 1, boardType = Produccion) activa para esta empresa. Por favor, crea una etapa en el catálogo de etapas antes de continuar.'
        });
      }

      stageId = firstStage._id;
      orderStatus = 'pendiente'; // Con stage asignado, status = 'pendiente'
    } else {
      // Si NO tiene anticipo Y NO se envía a producción
      // O si tiene descuento pendiente de autorización
      // Asignar status = 'sinAnticipo' (o 'pendiente' si tiene descuento pendiente) y stage = null
      orderStatus = hasPendingDiscountAuth ? 'pendiente' : 'sinAnticipo';
      stageId = null;
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
      sendToProduction: shouldSendToProduction,
      status: orderStatus, // Asignar el status determinado ('pendiente' o 'sinAnticipo')
      stage: stageId, // Asignar la etapa (puede ser null)
      isSocialMediaOrder: isSocialMediaOrder || false,
      socialMedia: socialMedia || null,
      materials: materials // Agregar los materiales extras
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

    // Descontar productos y materiales del almacén al crear la orden
    if (storage) {
      const hasProductsFromCatalog = items.some(item => item.isProduct === true);
      const hasExtras = items.some(item =>
        item.insumos && item.insumos.some(insumo => insumo.isExtra === true && insumo.materialId)
      );

      if (hasProductsFromCatalog || hasExtras) {
        // Arrays para rastrear qué productos y materiales se actualizaron
        const productsUpdated = [];
        const materialsUpdated = [];

        try {
          for (const item of items) {
            // Solo descontar si es un producto del catálogo
            if (item.isProduct === true && item.productId) {
              const productInStorageIndex = storage.products.findIndex(
                (p) => p.productId.toString() === item.productId
              );

              if (productInStorageIndex !== -1) {
                // Reducir la cantidad del producto en el almacén
                storage.products[productInStorageIndex].quantity -= item.quantity;

                // Si la cantidad llega a 0 o menos, no eliminar pero mantener en 0
                if (storage.products[productInStorageIndex].quantity < 0) {
                  storage.products[productInStorageIndex].quantity = 0;
                }

                // Rastrear el producto actualizado para el evento de socket
                productsUpdated.push({
                  productId: item.productId,
                  newQuantity: storage.products[productInStorageIndex].quantity,
                  quantityReduced: item.quantity
                });
              }
            }

            // Descontar materiales extras de los insumos
            if (item.insumos && Array.isArray(item.insumos)) {
              for (const insumo of item.insumos) {
                if (insumo.isExtra === true && insumo.materialId) {
                  const materialInStorageIndex = storage.materials.findIndex(
                    (m) => m.materialId.toString() === insumo.materialId
                  );

                  if (materialInStorageIndex !== -1) {
                    // Reducir la cantidad del material en el almacén
                    storage.materials[materialInStorageIndex].quantity -= insumo.cantidad;

                    // Si la cantidad llega a 0 o menos, mantener en 0
                    if (storage.materials[materialInStorageIndex].quantity < 0) {
                      storage.materials[materialInStorageIndex].quantity = 0;
                    }

                    // Rastrear el material actualizado para el evento de socket
                    materialsUpdated.push({
                      materialId: insumo.materialId,
                      newQuantity: storage.materials[materialInStorageIndex].quantity,
                      quantityReduced: insumo.cantidad
                    });
                  }
                }
              }
            }
          }

          // Actualizar la fecha de último egreso
          storage.lastOutcome = Date.now();
          await storage.save();
          console.log('Stock descontado exitosamente al crear orden:', savedOrder.orderNumber);

          // Emitir evento de socket para notificar actualización de stock a otros usuarios
          if (productsUpdated.length > 0 || materialsUpdated.length > 0) {
            emitStockUpdated(
              branchId,
              storage._id.toString(),
              productsUpdated,
              materialsUpdated,
              savedOrder.orderNumber
            );
          }
        } catch (storageError) {
          console.error('Error al descontar stock del almacén:', storageError);
          // Continuar con la creación de la orden aunque falle el descuento del stock
          // El administrador puede corregir el stock manualmente
        }
      }
    }

    // Si hay caja registradora asignada, actualizar su balance según el tipo de caja
    if (cashRegisterId && advance > 0 && paymentMethod) {
      try {
        // Obtener la caja registradora para saber si es de redes sociales
        const cashRegister = await CashRegister.findById(cashRegisterId);

        // Obtener el método de pago para verificar si es efectivo
        const paymentMethodDoc = await PaymentMethod.findById(paymentMethod);
        const isEffectivo = paymentMethodDoc?.name?.toLowerCase().includes('efectivo') || false;

        // Determinar si se debe actualizar el balance:
        // - Cajas normales: solo si el pago es en efectivo
        // - Cajas de redes sociales: todos los pagos EXCEPTO efectivo
        const shouldUpdateBalance = cashRegister?.isSocialMediaBox
          ? !isEffectivo  // Cajas de redes: actualizar si NO es efectivo
          : isEffectivo;  // Cajas normales: actualizar si ES efectivo

        // Actualizar el balance de la caja si corresponde
        if (shouldUpdateBalance && savedPaymentId) {
          await CashRegister.findByIdAndUpdate(
            cashRegisterId,
            {
              $inc: { currentBalance: advance },
              $push: {
                lastRegistry: {
                  orderId: savedOrder._id,
                  paymentIds: [savedPaymentId], // Agregar el ID del pago en el array
                  saleDate: new Date()
                }
              }
            }
          );
        }
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
      .populate('stage', 'name abreviation stageNumber color boardType')
      .populate({
        path: 'payments',
        populate: [
          { path: 'paymentMethod', select: 'name abbreviation' },
          { path: 'registeredBy', select: 'name email' }
        ]
      });

    // Si hay descuento pendiente, crear la solicitud de autorización ANTES de emitir el socket
    if (hasPendingDiscountAuth && discountRequestMessage && discountRequestMessage.trim() && discount > 0) {
      try {
        // Calcular monto del descuento
        const discountAmount = discountType === 'porcentaje'
          ? (subtotal * discount) / 100
          : discount;

        // Obtener la sucursal para obtener el gerente
        const branch = await Branch.findById(branchId).populate('manager');

        if (branch && branch.manager) {
          // Obtener información del usuario que solicita
          const requestingUser = await mongoose.model('cs_user').findById(req.user._id).populate('role');

          // Crear solicitud de autorización vinculada a la orden
          const discountAuth = new DiscountAuth({
            message: discountRequestMessage,
            managerId: branch.manager._id,
            requestedBy: req.user._id,
            branchId,
            orderId: savedOrder._id,
            orderTotal: total,
            discountValue: discount,
            discountType,
            discountAmount,
            isAuth: null,
            authFolio: null,
            isRedeemed: false
          });

          const savedAuth = await discountAuth.save();

          // Crear notificación para el gerente
          const notification = new OrderNotification({
            userId: branch.manager._id,
            username: requestingUser?.profile?.fullName || requestingUser?.username || 'Usuario',
            userRole: requestingUser?.role?.name || 'Usuario',
            branchId,
            orderNumber: `Solicitud de Descuento`,
            orderId: savedOrder._id,
            isDiscountAuth: true,
            discountAuthId: savedAuth._id,
            isRead: false
          });

          await notification.save();

          // Crear log de solicitud de descuento
          try {
            await orderLogService.createLog(
              savedOrder._id,
              'discount_requested',
              `Solicitud de descuento enviada al gerente: ${discount}${discountType === 'porcentaje' ? '%' : ' MXN'}`,
              req.user._id,
              requestingUser?.profile?.fullName || requestingUser?.username || 'Usuario',
              requestingUser?.role?.name || 'Usuario',
              {
                discountValue: discount,
                discountType,
                discountAmount,
                message: discountRequestMessage,
                discountAuthId: savedAuth._id
              }
            );
          } catch (logError) {
            console.error('Error al crear log de solicitud de descuento:', logError);
          }

          console.log('✅ DiscountAuth creado antes de emitir socket:', savedAuth._id);
        }
      } catch (discountAuthError) {
        console.error('Error al crear solicitud de descuento:', discountAuthError);
        // No fallar la orden si hay error al crear la solicitud de descuento
      }
    }

    // Emitir evento de socket para notificar a otros usuarios
    emitOrderCreated(populatedOrder);

    // Crear notificación para el gerente de la sucursal
    try {
      // Obtener información del usuario que creó la orden
      const creatorUser = await mongoose.model('cs_user').findById(req.user._id).populate('role');

      if (creatorUser && creatorUser.role) {
        const notification = new OrderNotification({
          userId: req.user._id,
          username: creatorUser.profile?.fullName || creatorUser.name || 'Usuario',
          userRole: creatorUser.role.name,
          branchId: savedOrder.branchId,
          orderNumber: savedOrder.orderNumber,
          orderId: savedOrder._id,
          isRead: false
        });

        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error al crear notificación:', notificationError);
      // No fallar la creación de la orden si falla la notificación
    }

    // Crear log de creación de orden
    try {
      const creatorUser = await mongoose.model('cs_user').findById(req.user._id).populate('role');
      await orderLogService.createLog(
        savedOrder._id,
        'order_created',
        `Orden ${savedOrder.orderNumber} creada`,
        req.user._id,
        creatorUser?.profile?.fullName || creatorUser?.name || 'Usuario',
        creatorUser?.role?.name || 'Usuario',
        {
          total: savedOrder.total,
          advance: savedOrder.advance,
          remainingBalance: savedOrder.remainingBalance,
          shippingType: savedOrder.shippingType,
          salesChannel: savedOrder.salesChannel,
          itemsCount: savedOrder.items?.length || 0
        }
      );
    } catch (logError) {
      console.error('Error al crear log de orden:', logError);
      // No fallar la creación de la orden si falla el log
    }

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
    const existingOrder = await Order.findById(id)
      .populate('stage', 'name abreviation stageNumber color boardType');
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Guardar stage anterior para comparación
    const previousStage = existingOrder.stage;
    const previousStatus = existingOrder.status;

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
      .populate('stage', 'name abreviation stageNumber color boardType')
      .populate({
        path: 'payments',
        populate: [
          { path: 'paymentMethod', select: 'name abbreviation' },
          { path: 'registeredBy', select: 'name email' }
        ]
      });

    // Registrar logs según los cambios realizados
    try {
      const user = await mongoose.model('cs_user').findById(req.user._id).populate('role');
      const userName = user?.profile?.fullName || user?.name || 'Usuario';
      const userRole = user?.role?.name || 'Usuario';

      // Log para cambio de stage
      if (updateData.stage && previousStage?._id?.toString() !== updateData.stage) {
        const newStage = updatedOrder.stage;
        await orderLogService.createLog(
          id,
          'stage_changed',
          `Etapa cambiada de "${previousStage?.name || 'Sin etapa'}" a "${newStage?.name}"`,
          req.user._id,
          userName,
          userRole,
          {
            oldStageId: previousStage?._id,
            oldStageName: previousStage?.name,
            oldStageNumber: previousStage?.stageNumber,
            oldBoardType: previousStage?.boardType,
            newStageId: newStage?._id,
            newStageName: newStage?.name,
            newStageNumber: newStage?.stageNumber,
            newBoardType: newStage?.boardType
          }
        );
      }

      // Log para cambio de status (que no sea a través de updateOrderStatus)
      if (updateData.status && previousStatus !== updateData.status) {
        const eventType = updateData.status === 'completado' ? 'order_completed' : 'status_changed';
        const description = updateData.status === 'completado'
          ? `Orden completada`
          : `Estado cambiado de "${previousStatus}" a "${updateData.status}"`;

        await orderLogService.createLog(
          id,
          eventType,
          description,
          req.user._id,
          userName,
          userRole,
          {
            oldStatus: previousStatus,
            newStatus: updateData.status
          }
        );
      }
    } catch (logError) {
      console.error('Error al crear log de actualización:', logError);
      // No fallar la actualización si falla el log
    }

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

    // Obtener la orden antes de actualizarla para saber su estado anterior
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const previousStatus = existingOrder.status;

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
      .populate('stage', 'name abreviation stageNumber color boardType')
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

    // Si la orden fue cancelada (y no estaba cancelada antes), restaurar stock y crear notificación
    if (status === 'cancelado' && previousStatus !== 'cancelado') {
      // Restaurar el stock de los productos del catálogo al almacén
      try {
        // Buscar el almacén de la sucursal de la orden
        const storage = await Storage.findOne({ branch: existingOrder.branchId });

        if (storage) {
          // Restaurar stock de cada producto del catálogo en la orden
          for (const item of existingOrder.items) {
            if (item.isProduct === true && item.productId) {
              const productInStorageIndex = storage.products.findIndex(
                (p) => p.productId.toString() === item.productId.toString()
              );

              if (productInStorageIndex !== -1) {
                // El producto ya existe en el almacén, incrementar su cantidad
                storage.products[productInStorageIndex].quantity += item.quantity;
              } else {
                // El producto no existe en el almacén, agregarlo
                storage.products.push({
                  productId: item.productId,
                  quantity: item.quantity
                });
              }
            }
          }

          // Actualizar fecha de último ingreso (porque estamos devolviendo stock)
          storage.lastIncome = Date.now();
          await storage.save();
          console.log('Stock restaurado al almacén por cancelación de orden:', order.orderNumber);
        }
      } catch (stockError) {
        console.error('Error al restaurar stock por cancelación:', stockError);
        // No fallar la cancelación si hay error al restaurar stock
        // El administrador puede corregir el stock manualmente
      }

      // Crear notificación de cancelación
      try {
        const canceledByUser = await mongoose.model('cs_user').findById(req.user._id).populate('role');

        if (canceledByUser && canceledByUser.role) {
          const notification = new OrderNotification({
            userId: req.user._id,
            username: canceledByUser.profile?.fullName || canceledByUser.name || 'Usuario',
            userRole: canceledByUser.role.name,
            branchId: order.branchId._id || order.branchId,
            orderNumber: order.orderNumber,
            orderId: order._id,
            isRead: false,
            isCanceled: true // Marcar como notificación de cancelación
          });

          await notification.save();
          console.log('Notificación de cancelación creada:', notification);
        }
      } catch (notificationError) {
        console.error('Error al crear notificación de cancelación:', notificationError);
        // No fallar la actualización del estado si falla la notificación
      }

      // Crear log de cancelación
      try {
        const canceledByUser = await mongoose.model('cs_user').findById(req.user._id).populate('role');
        await orderLogService.createLog(
          id,
          'order_cancelled',
          `Orden cancelada`,
          req.user._id,
          canceledByUser?.profile?.fullName || canceledByUser?.name || 'Usuario',
          canceledByUser?.role?.name || 'Usuario',
          {
            previousStatus,
            newStatus: 'cancelado',
            orderNumber: order.orderNumber
          }
        );
      } catch (logError) {
        console.error('Error al crear log de cancelación:', logError);
      }
    }

    // Si la orden fue completada, crear log
    if (status === 'completado' && previousStatus !== 'completado') {
      try {
        const completedByUser = await mongoose.model('cs_user').findById(req.user._id).populate('role');
        await orderLogService.createLog(
          id,
          'order_completed',
          `Orden completada`,
          req.user._id,
          completedByUser?.profile?.fullName || completedByUser?.name || 'Usuario',
          completedByUser?.role?.name || 'Usuario',
          {
            previousStatus,
            newStatus: 'completado',
            orderNumber: order.orderNumber
          }
        );
      } catch (logError) {
        console.error('Error al crear log de completado:', logError);
      }
    }

    // Para otros cambios de status
    if (status !== 'cancelado' && status !== 'completado' && previousStatus !== status) {
      try {
        const user = await mongoose.model('cs_user').findById(req.user._id).populate('role');
        await orderLogService.createLog(
          id,
          'status_changed',
          `Estado cambiado de "${previousStatus}" a "${status}"`,
          req.user._id,
          user?.profile?.fullName || user?.name || 'Usuario',
          user?.role?.name || 'Usuario',
          {
            previousStatus,
            newStatus: status
          }
        );
      } catch (logError) {
        console.error('Error al crear log de cambio de status:', logError);
      }
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

    // Obtener la orden antes de eliminarla para restaurar el stock
    const orderToDelete = await Order.findById(id);

    if (!orderToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Restaurar el stock de los productos del catálogo al almacén (solo si no está cancelada)
    // Si ya estaba cancelada, el stock ya fue restaurado
    if (orderToDelete.status !== 'cancelado') {
      try {
        const storage = await Storage.findOne({ branch: orderToDelete.branchId });

        if (storage) {
          for (const item of orderToDelete.items) {
            if (item.isProduct === true && item.productId) {
              const productInStorageIndex = storage.products.findIndex(
                (p) => p.productId.toString() === item.productId.toString()
              );

              if (productInStorageIndex !== -1) {
                storage.products[productInStorageIndex].quantity += item.quantity;
              } else {
                storage.products.push({
                  productId: item.productId,
                  quantity: item.quantity
                });
              }
            }
          }

          storage.lastIncome = Date.now();
          await storage.save();
          console.log('Stock restaurado al almacén por eliminación de orden:', orderToDelete.orderNumber);
        }
      } catch (stockError) {
        console.error('Error al restaurar stock por eliminación:', stockError);
        // Continuar con la eliminación aunque falle la restauración del stock
      }
    }

    // Ahora sí eliminar la orden
    const deletedOrder = await Order.findByIdAndDelete(id);

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

    // Obtener información del usuario con su rol
    const user = await mongoose.model('cs_user').findById(userId).populate('role');

    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o sin rol asignado'
      });
    }

    const userRole = user.role.name;
    let branchIds = [];

    // Verificar si el usuario tiene rol "Redes"
    if (userRole === 'Redes') {
      // Buscar la empresa donde el usuario está en el array redes
      const userCompany = await Company.findOne({
        redes: userId
      });

      if (!userCompany) {
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

      // Obtener todas las sucursales de la empresa
      const companyBranches = await Branch.find({
        companyId: userCompany._id
      }).select('_id');

      branchIds = companyBranches.map(branch => branch._id);
    } else if (userRole === 'Cajero') {
      // Para cajeros, solo su sucursal donde está como empleado
      const userBranches = await Branch.find({
        employees: userId
      }).select('_id');
      branchIds = userBranches.map(branch => branch._id);
    } else {
      // Lógica existente para Administrador y Gerente
      const userBranches = await Branch.find({
        $or: [
          { administrator: userId },
          { manager: userId },
          { employees: userId }
        ]
      }).select('_id');
      branchIds = userBranches.map(branch => branch._id);
    }

    if (branchIds.length === 0) {
      // Si el usuario no tiene sucursales asignadas, retornar estadísticas vacías
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
      branchId: { $in: branchIds } // Filtrar solo órdenes de sucursales
    };

    // Para usuarios con rol "Redes", agregar filtro de redes sociales
    if (userRole === 'Redes') {
      filters.isSocialMediaOrder = true;
    }

    // Para usuarios con rol "Cajero", agregar filtros específicos
    if (userRole === 'Cajero') {
      filters.cashier = userId; // Solo órdenes creadas por el cajero
      filters.isSocialMediaOrder = false; // Solo órdenes que NO son de redes sociales
    }

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

// Enviar orden a pizarrón de Envío
const sendOrderToShipping = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la orden actual
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Obtener la empresa a través de la sucursal
    const branch = await Branch.findById(order.branchId).populate('companyId');

    if (!branch || !branch.companyId) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo obtener la empresa asociada a la sucursal'
      });
    }

    const companyId = branch.companyId._id;

    // Buscar el primer stage de Envío (stageNumber = 1, boardType = 'Envio')
    const firstShippingStage = await StageCatalog.findOne({
      company: companyId,
      stageNumber: 1,
      boardType: 'Envio',
      isActive: true
    });

    if (!firstShippingStage) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró una etapa inicial de Envío (stageNumber = 1, boardType = Envio) activa para esta empresa.'
      });
    }

    // Actualizar la orden
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        sentToShipping: true,
        stage: firstShippingStage._id
      },
      { new: true, runValidators: true }
    )
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

    // Crear log de envío a shipping
    try {
      const user = await mongoose.model('cs_user').findById(req.user._id).populate('role');
      await orderLogService.createLog(
        id,
        'sent_to_shipping',
        `Orden enviada a envío - Etapa: ${firstShippingStage.name}`,
        req.user._id,
        user?.profile?.fullName || user?.name || 'Usuario',
        user?.role?.name || 'Usuario',
        {
          stageId: firstShippingStage._id,
          stageName: firstShippingStage.name,
          stageNumber: firstShippingStage.stageNumber,
          orderNumber: updatedOrder.orderNumber
        }
      );
    } catch (logError) {
      console.error('Error al crear log de envío a shipping:', logError);
    }

    // Emitir evento de socket para notificar a otros usuarios
    emitOrderUpdated(updatedOrder);

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Orden enviada al pizarrón de Envío exitosamente'
    });
  } catch (error) {
    console.error('Error al enviar orden a Envío:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar información de entrega de una orden
const updateOrderDeliveryInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, deliveryDateTime } = req.body;

    // Validar que se proporcione al menos un campo
    if (!message && !deliveryDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos el mensaje o la fecha de entrega'
      });
    }

    // Verificar si la orden existe
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Preparar los datos de actualización
    const updateData = {};

    if (message !== undefined) {
      updateData['deliveryData.message'] = message;
    }

    if (deliveryDateTime) {
      // Validar que sea una fecha válida
      const dateToValidate = new Date(deliveryDateTime);
      if (isNaN(dateToValidate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Fecha de entrega inválida'
        });
      }
      updateData['deliveryData.deliveryDateTime'] = deliveryDateTime;
    }

    // Actualizar la orden
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
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

    // Crear log de actualización
    try {
      const user = await mongoose.model('cs_user').findById(req.user._id).populate('role');
      const userName = user?.profile?.fullName || user?.name || 'Usuario';
      const userRole = user?.role?.name || 'Usuario';

      const changes = [];
      if (message !== undefined) {
        changes.push(`mensaje actualizado`);
      }
      if (deliveryDateTime) {
        changes.push(`fecha de entrega actualizada a ${new Date(deliveryDateTime).toLocaleDateString('es-MX')}`);
      }

      await orderLogService.createLog(
        id,
        'delivery_info_updated',
        `Información de entrega actualizada: ${changes.join(', ')}`,
        req.user._id,
        userName,
        userRole,
        {
          oldMessage: existingOrder.deliveryData?.message,
          newMessage: message,
          oldDeliveryDateTime: existingOrder.deliveryData?.deliveryDateTime,
          newDeliveryDateTime: deliveryDateTime
        }
      );
    } catch (logError) {
      console.error('Error al crear log de actualización de entrega:', logError);
      // No fallar la actualización si falla el log
    }

    // Emitir evento de socket para notificar a otros usuarios
    emitOrderUpdated(updatedOrder);

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Información de entrega actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar información de entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener órdenes sin autorizar (con descuento pendiente de autorización)
const getUnauthorizedOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      startDate,
      endDate,
      branchId
    } = req.query;

    // Obtener el ID del usuario autenticado
    const userId = req.user?._id;

    // Obtener información del usuario con su rol
    const user = await mongoose.model('cs_user').findById(userId).populate('role');

    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o sin rol asignado'
      });
    }

    const userRole = user.role.name;
    let branchIds = [];

    // Verificar si el usuario tiene rol "Redes"
    if (userRole === 'Redes') {
      const userCompany = await Company.findOne({
        redes: userId
      });

      if (!userCompany) {
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

      const companyBranches = await Branch.find({
        companyId: userCompany._id
      }).select('_id');

      branchIds = companyBranches.map(branch => branch._id);
    } else if (userRole === 'Cajero') {
      const userBranches = await Branch.find({
        employees: userId
      }).select('_id');
      branchIds = userBranches.map(branch => branch._id);
    } else {
      const userBranches = await Branch.find({
        $or: [
          { administrator: userId },
          { manager: userId },
          { employees: userId }
        ]
      }).select('_id');
      branchIds = userBranches.map(branch => branch._id);
    }

    if (branchIds.length === 0) {
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

    // Construir filtros base para órdenes con descuento > 0
    const filters = {
      discount: { $gt: 0 }, // Órdenes con descuento mayor a 0
      branchId: { $in: branchIds }
    };

    // Para usuarios con rol "Redes", agregar filtro de redes sociales
    if (userRole === 'Redes') {
      filters.isSocialMediaOrder = true;
    }

    // Para usuarios con rol "Cajero", agregar filtros específicos
    if (userRole === 'Cajero') {
      filters.cashier = userId;
      filters.isSocialMediaOrder = false;
    }

    // Si se proporciona branchId específico, aplicar ese filtro
    if (branchId) {
      const specificBranchId = new mongoose.Types.ObjectId(branchId);
      const isBranchAllowed = branchIds.some(id => id.equals(specificBranchId));

      if (isBranchAllowed) {
        filters.branchId = specificBranchId;
      } else {
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

    console.log('getUnauthorizedOrders - Filtros aplicados:', JSON.stringify(filters, null, 2));

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Primero obtener TODAS las órdenes con descuento (sin paginación aún)
    const allOrdersWithDiscount = await Order.find(filters)
      .select('_id')
      .sort({ createdAt: -1 });

    if (allOrdersWithDiscount.length === 0) {
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

    const allOrderIds = allOrdersWithDiscount.map(order => order._id);

    // Buscar DiscountAuth para estas órdenes con isRedeemed=false y isAuth != false
    const validDiscountAuths = await DiscountAuth.find({
      orderId: { $in: allOrderIds },
      isRedeemed: false,
      isAuth: { $ne: false } // null (pendiente) o true (aprobado), pero NO false (rechazado)
    }).select('orderId');

    const validOrderIds = validDiscountAuths.map(auth => auth.orderId);

    if (validOrderIds.length === 0) {
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

    // Ahora sí aplicar paginación sobre las órdenes válidas
    const orders = await Order.find({
      _id: { $in: validOrderIds }
    })
      .populate('branchId', 'branchName branchCode')
      .populate('cashRegisterId', 'name isOpen')
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
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de órdenes válidas
    const total = validOrderIds.length;
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
    console.error('Error al obtener órdenes sin autorizar:', error);
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
  getOrdersSummary,
  sendOrderToShipping,
  updateOrderDeliveryInfo,
  getUnauthorizedOrders
};
