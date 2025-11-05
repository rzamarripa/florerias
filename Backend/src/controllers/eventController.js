import { Event } from '../models/Event.js';
import { EventPayment } from '../models/EventPayment.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import PaymentMethod from '../models/PaymentMethod.js';
import mongoose from 'mongoose';

// Obtener todos los eventos con filtros y paginación
const getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      branchId,
      paymentStatus,
      clientId
    } = req.query;

    // Obtener el ID del usuario autenticado
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
      branch: { $in: branchIds } // Filtrar solo eventos de sucursales donde el usuario es administrador o gerente
    };

    if (paymentStatus) {
      filters.paymentStatus = paymentStatus;
    }

    if (clientId) {
      filters.client = clientId;
    }

    if (branchId) {
      // Si se proporciona branchId específico, verificar que esté en las sucursales del usuario
      const specificBranchId = new mongoose.Types.ObjectId(branchId);
      const isBranchAllowed = branchIds.some(id => id.equals(specificBranchId));

      if (isBranchAllowed) {
        filters.branch = specificBranchId;
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

    // Filtros de fecha del evento
    if (startDate || endDate) {
      filters.eventDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filters.eventDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.eventDate.$lte = end;
      }
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener eventos con paginación
    const events = await Event.find(filters)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('client', 'name lastName phoneNumber email clientNumber')
      .populate('paymentMethod', 'name abbreviation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Event.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un evento por ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const event = await Event.findById(id)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('client', 'name lastName phoneNumber email clientNumber')
      .populate('paymentMethod', 'name abbreviation');

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
    const hasAccess = branchIds.some(branchId => branchId.equals(event.branch._id));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este evento'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo evento
const createEvent = async (req, res) => {
  try {
    const {
      client,
      eventDate,
      orderDate,
      totalAmount,
      totalPaid,
      paymentMethod
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!client || !eventDate || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Los campos cliente, fecha del evento y total a pagar son obligatorios'
      });
    }

    // Validar que si hay totalPaid, también debe haber paymentMethod
    if (totalPaid && totalPaid > 0 && !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Si se registra un pago inicial, el método de pago es requerido'
      });
    }

    // Validar que el cliente existe
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(400).json({
        success: false,
        message: 'El cliente seleccionado no existe'
      });
    }

    // Validar que el método de pago existe si se proporciona
    if (paymentMethod) {
      const paymentMethodExists = await PaymentMethod.findById(paymentMethod);
      if (!paymentMethodExists) {
        return res.status(400).json({
          success: false,
          message: 'El método de pago seleccionado no existe'
        });
      }
    }

    // Buscar la sucursal del usuario (administrador o gerente)
    const userBranch = await Branch.findOne({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    });

    if (!userBranch) {
      return res.status(403).json({
        success: false,
        message: 'El usuario no está asignado como administrador o gerente de ninguna sucursal'
      });
    }

    // Crear nuevo evento
    const newEvent = new Event({
      client,
      eventDate,
      orderDate: orderDate || Date.now(),
      totalAmount,
      totalPaid: totalPaid || 0,
      paymentMethod: paymentMethod || undefined,
      user: userId,
      branch: userBranch._id
    });

    const savedEvent = await newEvent.save();

    // Si hay un pago inicial (totalPaid > 0), registrarlo en EventPayment
    if (totalPaid && totalPaid > 0 && paymentMethod) {
      const initialPayment = new EventPayment({
        event: savedEvent._id,
        amount: totalPaid,
        paymentMethod: paymentMethod,
        user: userId,
        branch: userBranch._id,
        notes: 'Pago inicial al crear el evento',
        paymentDate: new Date()
      });

      await initialPayment.save();
    }

    // Popular el evento guardado antes de devolverlo
    const populatedEvent = await Event.findById(savedEvent._id)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('client', 'name lastName phoneNumber email clientNumber')
      .populate('paymentMethod', 'name abbreviation');

    res.status(201).json({
      success: true,
      data: populatedEvent,
      message: 'Evento creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear evento:', error);

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

// Actualizar un evento
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar si el evento existe
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para editar este evento
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(existingEvent.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este evento'
      });
    }

    // No permitir actualizar ciertos campos
    delete updateData.folio;
    delete updateData.branch;
    delete updateData.user;

    // Validar que el cliente existe si se está actualizando
    if (updateData.client) {
      const clientExists = await Client.findById(updateData.client);
      if (!clientExists) {
        return res.status(400).json({
          success: false,
          message: 'El cliente seleccionado no existe'
        });
      }
    }

    // Validar estatus de pago si se proporciona
    if (updateData.paymentStatus && !['pending', 'partial', 'paid'].includes(updateData.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Estatus de pago inválido. Debe ser "pending", "partial" o "paid"'
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('client', 'name lastName phoneNumber email clientNumber')
      .populate('paymentMethod', 'name abbreviation');

    res.status(200).json({
      success: true,
      data: updatedEvent,
      message: 'Evento actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);

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

// Eliminar un evento
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para eliminar este evento
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
        message: 'No tienes permiso para eliminar este evento'
      });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
