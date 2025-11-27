import DiscountAuth from '../models/DiscountAuth.js';
import OrderNotification from '../models/OrderNotification.js';
import { Branch } from '../models/Branch.js';
import mongoose from 'mongoose';

// Generar folio de autorización único
const generateAuthFolio = async () => {
  const prefix = 'AUTH';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Buscar el último folio del día
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const lastAuth = await DiscountAuth.findOne({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
    authFolio: { $ne: null }
  }).sort({ authFolio: -1 });

  let sequential = 1;
  if (lastAuth && lastAuth.authFolio) {
    const lastSequential = parseInt(lastAuth.authFolio.slice(-4));
    sequential = lastSequential + 1;
  }

  const folio = `${prefix}-${year}${month}${day}-${String(sequential).padStart(4, '0')}`;
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
      .populate('branchId', 'branchName branchCode');

    res.status(200).json({
      success: true,
      data: populatedAuth,
      message: isApproved
        ? `Autorización aprobada. Folio: ${discountAuth.authFolio}`
        : 'Autorización rechazada'
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

export {
  requestDiscountAuth,
  approveRejectDiscountAuth,
  getAllDiscountAuths,
  getDiscountAuthById,
  redeemDiscountFolio
};
