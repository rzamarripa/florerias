import Ticket from '../models/Ticket.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Crear un nuevo ticket
const createTicket = async (req, res) => {
  try {
    const {
      orderId,
      branchId,
      url,
      path,
      isStoreTicket
    } = req.body;

    // Validar campos requeridos
    if (!orderId || !branchId || !url || !path) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos: orderId, branchId, url, path'
      });
    }

    // Verificar que la orden existe
    const orderExists = await Order.findById(orderId);
    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'La orden no existe'
      });
    }

    // Verificar si ya existe un ticket del mismo tipo para esta orden
    const existingTicket = await Ticket.findOne({
      orderId,
      isStoreTicket: isStoreTicket !== undefined ? isStoreTicket : true
    });

    if (existingTicket) {
      // Actualizar el ticket existente
      existingTicket.url = url;
      existingTicket.path = path;
      const updatedTicket = await existingTicket.save();
      
      return res.status(200).json({
        success: true,
        data: updatedTicket,
        message: 'Ticket actualizado exitosamente'
      });
    }

    // Crear nuevo ticket
    const newTicket = new Ticket({
      orderId,
      branchId,
      url,
      path,
      isStoreTicket: isStoreTicket !== undefined ? isStoreTicket : true
    });

    const savedTicket = await newTicket.save();

    res.status(201).json({
      success: true,
      data: savedTicket,
      message: 'Ticket creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todos los tickets de una orden
const getTicketsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de orden inválido'
      });
    }

    const tickets = await Ticket.findByOrderId(orderId);

    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener ticket de venta (tienda) de una orden
const getStoreTicket = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de orden inválido'
      });
    }

    const ticket = await Ticket.findStoreTicket(orderId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ticket de venta para esta orden'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error al obtener ticket de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener ticket de envío de una orden
const getDeliveryTicket = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de orden inválido'
      });
    }

    const ticket = await Ticket.findDeliveryTicket(orderId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ticket de envío para esta orden'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error al obtener ticket de envío:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un ticket
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de ticket inválido'
      });
    }

    const deletedTicket = await Ticket.findByIdAndDelete(id);

    if (!deletedTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket eliminado exitosamente',
      data: deletedTicket
    });
  } catch (error) {
    console.error('Error al eliminar ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  createTicket,
  getTicketsByOrderId,
  getStoreTicket,
  getDeliveryTicket,
  deleteTicket
};