import DiscountAuth from '../models/DiscountAuth.js';
import OrderNotification from '../models/OrderNotification.js';
import { Branch } from '../models/Branch.js';
import Order from '../models/Order.js';
import OrderPayment from '../models/OrderPayment.js';
import CashRegister from '../models/CashRegister.js';
import { Storage } from '../models/Storage.js';
import { StageCatalog } from '../models/StageCatalog.js';
import mongoose from 'mongoose';
import { emitOrderUpdated } from '../sockets/orderSocket.js';

// Generar folio de autorización único (número random de 5 dígitos)
const generateAuthFolio = async () => {
  let folio;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevenir bucle infinito

  while (!isUnique && attempts < maxAttempts) {
    // Generar número random de 5 dígitos (10000 - 99999)
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    folio = randomNumber.toString();

    // Verificar si el folio ya existe en la base de datos
    const existingAuth = await DiscountAuth.findOne({ authFolio: folio });

    if (!existingAuth) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('No se pudo generar un folio único después de múltiples intentos');
  }

  return folio;
};

// Solicitar autorización de descuento
const requestDiscountAuth = async (req, res) => {
  try {
    const { message, branchId, discountValue, discountType } = req.body;

    // Validar campos requeridos
    if (!message || !branchId) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje y la sucursal son obligatorios'
      });
    }

    // Validar discountValue
    if (discountValue === undefined || discountValue === null || discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El valor del descuento es obligatorio y debe ser mayor a 0'
      });
    }

    // Validar discountType
    if (!discountType || !['porcentaje', 'cantidad'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de descuento debe ser "porcentaje" o "cantidad"'
      });
    }

    // Obtener el usuario que solicita
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener información del usuario
    const requestingUser = await mongoose.model('cs_user').findById(userId).populate('role');
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Buscar la sucursal y su gerente
    const branch = await Branch.findById(branchId).populate('manager');
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    if (!branch.manager) {
      return res.status(400).json({
        success: false,
        message: 'La sucursal no tiene un gerente asignado'
      });
    }

    // Crear solicitud de autorización
    const discountAuth = new DiscountAuth({
      message,
      managerId: branch.manager._id,
      requestedBy: userId,
      branchId,
      discountValue,
      discountType,
      isAuth: null,
      authFolio: null,
      isRedeemed: false
    });

    const savedAuth = await discountAuth.save();

    // Crear notificación para el gerente
    const notification = new OrderNotification({
      userId: branch.manager._id,
      username: requestingUser.profile?.fullName || requestingUser.username || 'Usuario',
      userRole: requestingUser.role?.name || 'Usuario',
      branchId,
      orderNumber: `Solicitud de Descuento`, // Placeholder
      orderId: null, // No está vinculado a una orden específica
      isDiscountAuth: true,
      discountAuthId: savedAuth._id,
      isRead: false
    });

    await notification.save();

    // Popular la solicitud antes de devolverla
    const populatedAuth = await DiscountAuth.findById(savedAuth._id)
      .populate('managerId', 'username email profile')
      .populate('requestedBy', 'username email profile')
      .populate('branchId', 'branchName branchCode');

    res.status(201).json({
      success: true,
      data: populatedAuth,
      message: 'Solicitud de autorización enviada al gerente exitosamente'
    });
  } catch (error) {
    console.error('Error al solicitar autorización de descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Aprobar o rechazar autorización de descuento
const approveRejectDiscountAuth = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (isApproved === undefined || isApproved === null) {
      return res.status(400).json({
        success: false,
        message: 'El estado de aprobación es requerido'
      });
    }

    // Buscar la solicitud
    const discountAuth = await DiscountAuth.findById(id);
    if (!discountAuth) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de autorización no encontrada'
      });
    }

    // Validar que no haya sido procesada anteriormente
    if (discountAuth.isAuth !== null) {
      return res.status(400).json({
        success: false,
        message: 'Esta solicitud ya fue procesada anteriormente'
      });
    }

    // Validar que el usuario sea el gerente asignado
    const userId = req.user?._id;
    if (userId.toString() !== discountAuth.managerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el gerente asignado puede aprobar o rechazar esta solicitud'
      });
    }

    // Actualizar la solicitud
    discountAuth.isAuth = isApproved;
    discountAuth.approvedAt = new Date();

    // Si se aprueba, generar folio de autorización único
    if (isApproved) {
      let folio;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      // Intentar generar un folio único
      while (!isUnique && attempts < maxAttempts) {
        folio = await generateAuthFolio();
        const existingFolio = await DiscountAuth.findOne({ authFolio: folio });
        if (!existingFolio) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo generar un folio único después de varios intentos'
        });
      }

      discountAuth.authFolio = folio;
    } else {
      // Si se rechaza, cancelar la orden vinculada y revertir cambios
      if (discountAuth.orderId) {
        try {
          const order = await Order.findById(discountAuth.orderId);

          if (order) {
            // 1. Restaurar stock de productos del catálogo
            const storage = await Storage.findOne({ branch: order.branchId });

            if (storage) {
              for (const item of order.items) {
                if (item.isProduct === true && item.productId) {
                  const productInStorageIndex = storage.products.findIndex(
                    (p) => p.productId.toString() === item.productId.toString()
                  );

                  if (productInStorageIndex !== -1) {
                    // El producto existe, incrementar cantidad
                    storage.products[productInStorageIndex].quantity += item.quantity;
                  } else {
                    // El producto no existe, agregarlo
                    storage.products.push({
                      productId: item.productId,
                      quantity: item.quantity
                    });
                  }
                }
              }

              storage.lastIncome = Date.now();
              await storage.save();
              console.log('Stock restaurado por rechazo de descuento:', order.orderNumber);
            }

            // 2. Revertir pagos y balance de caja registradora
            if (order.payments && order.payments.length > 0) {
              for (const paymentId of order.payments) {
                const payment = await OrderPayment.findById(paymentId);

                if (payment && payment.cashRegisterId) {
                  const cashRegister = await CashRegister.findById(payment.cashRegisterId);

                  if (cashRegister) {
                    // Restar el monto del pago del balance de la caja
                    cashRegister.currentBalance -= payment.amount;

                    // Eliminar el registro de lastRegistry relacionado con esta orden
                    cashRegister.lastRegistry = cashRegister.lastRegistry.filter(
                      reg => reg.orderId?.toString() !== order._id.toString()
                    );

                    await cashRegister.save();
                    console.log('Balance de caja revertido por rechazo de descuento');
                  }
                }

                // Eliminar el registro de pago
                await OrderPayment.findByIdAndDelete(paymentId);
              }
            }

            // 3. Cancelar la orden
            order.status = 'cancelado';
            order.payments = [];
            await order.save();

            console.log('Orden cancelada por rechazo de descuento:', order.orderNumber);
          }
        } catch (orderError) {
          console.error('Error al revertir orden por rechazo de descuento:', orderError);
          // No fallar la operación principal si hay error al revertir
        }
      }
    }

    await discountAuth.save();

    // Actualizar la notificación como leída
    await OrderNotification.updateOne(
      { discountAuthId: id },
      { isRead: true }
    );

    // Popular antes de devolver
    const populatedAuth = await DiscountAuth.findById(id)
      .populate('managerId', 'username email profile')
      .populate('requestedBy', 'username email profile')
      .populate('branchId', 'branchName branchCode')
      .populate('orderId', 'orderNumber status');

    res.status(200).json({
      success: true,
      data: populatedAuth,
      message: isApproved
        ? `Autorización aprobada. Folio: ${discountAuth.authFolio}`
        : 'Autorización rechazada. La orden ha sido cancelada y los cambios revertidos.'
    });
  } catch (error) {
    console.error('Error al procesar autorización de descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todas las solicitudes de autorización
const getAllDiscountAuths = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      branchId,
      isAuth,
      managerId,
      requestedBy
    } = req.query;

    // Construir filtros
    const filters = {};

    if (branchId) filters.branchId = branchId;
    if (isAuth !== undefined) {
      if (isAuth === 'null') {
        filters.isAuth = null;
      } else {
        filters.isAuth = isAuth === 'true';
      }
    }
    if (managerId) filters.managerId = managerId;
    if (requestedBy) filters.requestedBy = requestedBy;

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener solicitudes con paginación
    const discountAuths = await DiscountAuth.find(filters)
      .populate('managerId', 'username email profile')
      .populate('requestedBy', 'username email profile')
      .populate('branchId', 'branchName branchCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await DiscountAuth.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: discountAuths,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener autorizaciones de descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una solicitud por ID
const getDiscountAuthById = async (req, res) => {
  try {
    const { id } = req.params;

    const discountAuth = await DiscountAuth.findById(id)
      .populate('managerId', 'username email profile')
      .populate('requestedBy', 'username email profile')
      .populate('branchId', 'branchName branchCode');

    if (!discountAuth) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de autorización no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: discountAuth
    });
  } catch (error) {
    console.error('Error al obtener autorización de descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Validar y canjear folio de autorización
const redeemDiscountFolio = async (req, res) => {
  try {
    const { authFolio, branchId } = req.body;

    if (!authFolio || !branchId) {
      return res.status(400).json({
        success: false,
        message: 'El folio de autorización y la sucursal son requeridos'
      });
    }

    // Buscar el folio
    const discountAuth = await DiscountAuth.findOne({ authFolio: authFolio.trim().toUpperCase() });

    if (!discountAuth) {
      return res.status(404).json({
        success: false,
        message: 'Folio de autorización no encontrado'
      });
    }

    // Validar que el folio esté aprobado
    if (discountAuth.isAuth !== true) {
      return res.status(400).json({
        success: false,
        message: 'Este folio no ha sido aprobado'
      });
    }

    // Validar que el folio pertenezca a la sucursal
    if (discountAuth.branchId.toString() !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'Este folio no pertenece a la sucursal seleccionada'
      });
    }

    // Validar que el folio no haya sido canjeado
    if (discountAuth.isRedeemed) {
      return res.status(400).json({
        success: false,
        message: 'Este folio ya ha sido canjeado previamente'
      });
    }

    // Marcar como canjeado
    discountAuth.isRedeemed = true;
    await discountAuth.save();

    // Retornar información del descuento
    res.status(200).json({
      success: true,
      data: {
        discountValue: discountAuth.discountValue,
        discountType: discountAuth.discountType,
        authFolio: discountAuth.authFolio
      },
      message: 'Folio canjeado exitosamente'
    });
  } catch (error) {
    console.error('Error al canjear folio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear solicitud de descuento vinculada a una orden
const createDiscountAuthForOrder = async (req, res) => {
  try {
    const { message, branchId, orderId, orderTotal, discountValue, discountType, discountAmount } = req.body;

    // Validar campos requeridos
    if (!message || !branchId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje, la sucursal y el ID de la orden son obligatorios'
      });
    }

    // Validar discountValue
    if (discountValue === undefined || discountValue === null || discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El valor del descuento es obligatorio y debe ser mayor a 0'
      });
    }

    // Validar discountType
    if (!discountType || !['porcentaje', 'cantidad'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de descuento debe ser "porcentaje" o "cantidad"'
      });
    }

    // Obtener el usuario que solicita
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener información del usuario
    const requestingUser = await mongoose.model('cs_user').findById(userId).populate('role');
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Buscar la sucursal y su gerente
    const branch = await Branch.findById(branchId).populate('manager');
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    if (!branch.manager) {
      return res.status(400).json({
        success: false,
        message: 'La sucursal no tiene un gerente asignado'
      });
    }

    // Crear solicitud de autorización vinculada a la orden
    const discountAuth = new DiscountAuth({
      message,
      managerId: branch.manager._id,
      requestedBy: userId,
      branchId,
      orderId,
      orderTotal: orderTotal || 0,
      discountValue,
      discountType,
      discountAmount: discountAmount || 0,
      isAuth: null,
      authFolio: null,
      isRedeemed: false
    });

    const savedAuth = await discountAuth.save();

    // Crear notificación para el gerente
    const notification = new OrderNotification({
      userId: branch.manager._id,
      username: requestingUser.profile?.fullName || requestingUser.username || 'Usuario',
      userRole: requestingUser.role?.name || 'Usuario',
      branchId,
      orderNumber: `Solicitud de Descuento`,
      orderId: orderId,
      isDiscountAuth: true,
      discountAuthId: savedAuth._id,
      isRead: false
    });

    await notification.save();

    // Popular la solicitud antes de devolverla
    const populatedAuth = await DiscountAuth.findById(savedAuth._id)
      .populate('managerId', 'username email profile')
      .populate('requestedBy', 'username email profile')
      .populate('branchId', 'branchName branchCode')
      .populate('orderId', 'orderNumber total');

    res.status(201).json({
      success: true,
      data: populatedAuth,
      message: 'Solicitud de autorización vinculada a la orden creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear solicitud de descuento para orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Canjear folio de autorización y enviar orden a producción
const redeemAuthorizationForOrder = async (req, res) => {
  try {
    const { orderId, authFolio } = req.body;

    // Validar orderId y authFolio
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la orden es obligatorio'
      });
    }

    if (!authFolio) {
      return res.status(400).json({
        success: false,
        message: 'El folio de autorización es obligatorio'
      });
    }

    // Buscar el DiscountAuth correspondiente a esta orden
    const discountAuth = await DiscountAuth.findOne({ orderId });

    if (!discountAuth) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una autorización de descuento para esta orden'
      });
    }

    // Validar que el folio ingresado corresponda a esta autorización
    if (discountAuth.authFolio !== authFolio.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El folio de autorización ingresado no corresponde a esta orden'
      });
    }

    // Verificar que la autorización haya sido aprobada
    if (discountAuth.isAuth !== true) {
      return res.status(400).json({
        success: false,
        message: discountAuth.isAuth === false
          ? 'La autorización de descuento fue rechazada'
          : 'La autorización de descuento está pendiente de aprobación'
      });
    }

    // Verificar que no haya sido canjeada previamente
    if (discountAuth.isRedeemed) {
      return res.status(400).json({
        success: false,
        message: 'Esta autorización ya fue canjeada previamente'
      });
    }

    // Obtener la orden
    const order = await Order.findById(orderId);

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

    // Buscar el primer stage de Producción (stageNumber = 1, boardType = 'Produccion')
    const firstProductionStage = await StageCatalog.findOne({
      company: companyId,
      stageNumber: 1,
      boardType: 'Produccion',
      isActive: true
    });

    if (!firstProductionStage) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró una etapa inicial de Producción activa para esta empresa.'
      });
    }

    // Marcar la autorización como canjeada
    discountAuth.isRedeemed = true;
    await discountAuth.save();

    // Actualizar la orden para enviarla a producción
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        sendToProduction: true,
        stage: firstProductionStage._id
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

    // Emitir evento de socket para notificar a otros usuarios
    emitOrderUpdated(updatedOrder);

    res.status(200).json({
      success: true,
      data: {
        order: updatedOrder,
        discountAuth: discountAuth
      },
      message: 'Folio canjeado y orden enviada a producción exitosamente'
    });
  } catch (error) {
    console.error('Error al canjear folio de autorización:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  requestDiscountAuth,
  approveRejectDiscountAuth,
  getAllDiscountAuths,
  getDiscountAuthById,
  redeemDiscountFolio,
  createDiscountAuthForOrder,
  redeemAuthorizationForOrder
};
