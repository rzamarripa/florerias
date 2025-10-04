import Order from '../models/Order.js';
import Product from '../models/Product.js';

// Obtener todas las órdenes con filtros y paginación
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      salesChannel,
      clientName,
      orderNumber
    } = req.query;

    // Construir filtros
    const filters = {};

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

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener órdenes con paginación
    const orders = await Order.find(filters)
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
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
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email');

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
      clientInfo,
      salesChannel,
      items,
      shippingType,
      recipientName,
      deliveryDateTime,
      message,
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

    // Validar que los productos existan
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${item.productId} no encontrado`
        });
      }
    }

    // Crear nueva orden
    const newOrder = new Order({
      clientInfo,
      salesChannel: salesChannel || 'tienda',
      items,
      shippingType: shippingType || 'tienda',
      recipientName,
      deliveryDateTime,
      message,
      paymentMethod: paymentMethod || 'efectivo',
      discount: discount || 0,
      discountType: discountType || 'porcentaje',
      subtotal,
      total,
      advance: advance || 0,
      paidWith: paidWith || 0,
      change: change || 0,
      remainingBalance: remainingBalance || 0,
      sendToProduction: sendToProduction || false
    });

    const savedOrder = await newOrder.save();

    // Popular la orden guardada antes de devolverla
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email');

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

    // Si se actualizan items, validar que los productos existan
    if (updateData.items && updateData.items.length > 0) {
      for (const item of updateData.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email');

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
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

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

export {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};
