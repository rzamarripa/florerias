import PaymentMethod from '../models/PaymentMethod.js';

// Obtener todos los métodos de pago con filtros y paginación
const getAllPaymentMethods = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      name
    } = req.query;

    // Construir filtros
    const filters = {};

    if (status !== undefined) {
      filters.status = status === 'true';
    }

    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener métodos de pago con paginación
    const paymentMethods = await PaymentMethod.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await PaymentMethod.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: paymentMethods,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un método de pago por ID
const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('Error al obtener método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo método de pago
const createPaymentMethod = async (req, res) => {
  try {
    const { name, abbreviation } = req.body;

    // Validar campos requeridos
    if (!name || !abbreviation) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y la abreviatura son obligatorios'
      });
    }

    // Crear nuevo método de pago
    const newPaymentMethod = new PaymentMethod({
      name,
      abbreviation
    });

    const savedPaymentMethod = await newPaymentMethod.save();

    res.status(201).json({
      success: true,
      data: savedPaymentMethod,
      message: 'Método de pago creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear método de pago:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un método de pago con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar un método de pago
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si el método de pago existe
    const existingPaymentMethod = await PaymentMethod.findById(id);
    if (!existingPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedPaymentMethod,
      message: 'Método de pago actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar método de pago:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un método de pago con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar estado de método de pago
const updatePaymentMethodStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const paymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod,
      message: 'Estado de método de pago actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado de método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar un método de pago
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPaymentMethod = await PaymentMethod.findByIdAndDelete(id);

    if (!deletedPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Método de pago eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  updatePaymentMethodStatus,
  deletePaymentMethod
};
