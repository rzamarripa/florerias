import { EventPayment } from '../models/EventPayment.js';
import { Event } from '../models/Event.js';
import { Branch } from '../models/Branch.js';
import PaymentMethod from '../models/PaymentMethod.js';
import mongoose from 'mongoose';

// Crear un nuevo pago para un evento
export const createEventPayment = async (req, res) => {
  try {
    const { eventId, amount, paymentMethod, notes } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!eventId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Los campos evento, monto y método de pago son obligatorios'
      });
    }

    // Validar que el evento existe
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para registrar pagos en este evento
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(event.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para registrar pagos en este evento'
      });
    }

    // Validar que el monto no exceda el saldo pendiente
    if (amount > event.balance) {
      return res.status(400).json({
        success: false,
        message: 'El monto del pago excede el saldo pendiente del evento',
        balance: event.balance
      });
    }

    // Validar que el método de pago existe
    const paymentMethodExists = await PaymentMethod.findById(paymentMethod);
    if (!paymentMethodExists) {
      return res.status(400).json({
        success: false,
        message: 'El método de pago seleccionado no existe'
      });
    }

    // Crear el pago
    const payment = new EventPayment({
      event: eventId,
      amount,
      paymentMethod,
      user: userId,
      branch: event.branch,
      notes: notes || '',
      paymentDate: new Date()
    });

    await payment.save();

    // Actualizar el evento
    event.totalPaid += amount;
    await event.save(); // El middleware pre-save se encarga de actualizar balance y paymentStatus

    // Obtener el pago con sus referencias pobladas
    const populatedPayment = await EventPayment.findById(payment._id)
      .populate('paymentMethod', 'name abbreviation')
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode');

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: populatedPayment,
      event: {
        totalPaid: event.totalPaid,
        balance: event.balance,
        paymentStatus: event.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error al crear pago de evento:', error);

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

// Obtener todos los pagos de un evento específico
export const getEventPayments = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar que el evento existe
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para ver este evento
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(event.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver los pagos de este evento'
      });
    }

    const payments = await EventPayment.find({ event: eventId })
      .populate('paymentMethod', 'name abbreviation')
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error al obtener pagos de evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un pago específico por ID
export const getEventPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const payment = await EventPayment.findById(id)
      .populate('event')
      .populate('paymentMethod', 'name abbreviation')
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para ver este pago
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(payment.branch._id));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pago'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error al obtener pago de evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un pago (con reversión de saldos)
export const deleteEventPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const payment = await EventPayment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para eliminar este pago
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(payment.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este pago'
      });
    }

    // Obtener el evento
    const event = await Event.findById(payment.event);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento asociado no encontrado'
      });
    }

    // Revertir los cambios en el evento
    event.totalPaid -= payment.amount;
    await event.save(); // El middleware pre-save se encarga de actualizar balance y paymentStatus

    // Eliminar el pago
    await EventPayment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Pago eliminado exitosamente',
      event: {
        totalPaid: event.totalPaid,
        balance: event.balance,
        paymentStatus: event.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error al eliminar pago de evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todos los pagos con filtros opcionales
export const getAllEventPayments = async (req, res) => {
  try {
    const { branchId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Buscar todas las sucursales donde el usuario es administrador o gerente
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);

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

    const query = {
      branch: { $in: branchIds }
    };

    if (branchId) {
      const specificBranchId = new mongoose.Types.ObjectId(branchId);
      const isBranchAllowed = branchIds.some(id => id.equals(specificBranchId));

      if (isBranchAllowed) {
        query.branch = specificBranchId;
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

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.paymentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await EventPayment.find(query)
      .populate('event', 'folio eventDate totalAmount')
      .populate('paymentMethod', 'name abbreviation')
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await EventPayment.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener pagos de eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
