import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PaymentMethod from '../models/PaymentMethod.js';

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
      .populate('paymentMethod', 'name abbreviation')
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
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation');

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

    // Validar que los productos del catálogo existan
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

    // Crear nueva orden
    const newOrder = new Order({
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
        neighborhood: deliveryData.neighborhood || null,
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
      sendToProduction: sendToProduction || false
    });

    const savedOrder = await newOrder.save();

    // Popular la orden guardada antes de devolverla
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation');

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
      .populate('items.productId', 'nombre imagen')
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation');

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
      .populate('clientInfo.clientId', 'name lastName phoneNumber email')
      .populate('paymentMethod', 'name abbreviation');

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
