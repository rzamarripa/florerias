import { Buy } from '../models/Buy.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import PaymentMethod from '../models/PaymentMethod.js';
import mongoose from 'mongoose';

// Obtener todas las compras con filtros y paginación
const getAllBuys = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      branchId,
      paymentMethodId
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
      branch: { $in: branchIds } // Filtrar solo compras de sucursales donde el usuario es administrador o gerente
    };

    if (paymentMethodId) {
      filters.paymentMethod = paymentMethodId;
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

    // Filtros de fecha
    if (startDate || endDate) {
      filters.paymentDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filters.paymentDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.paymentDate.$lte = end;
      }
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener compras con paginación
    const buys = await Buy.find(filters)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('paymentMethod', 'name abbreviation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Buy.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: buys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una compra por ID
const getBuyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const buy = await Buy.findById(id)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('paymentMethod', 'name abbreviation');

    if (!buy) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Verificar que el usuario tenga permiso para ver esta compra
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(buy.branch._id));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta compra'
      });
    }

    res.status(200).json({
      success: true,
      data: buy
    });
  } catch (error) {
    console.error('Error al obtener compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva compra
const createBuy = async (req, res) => {
  try {
    const {
      paymentDate,
      concept,
      amount,
      paymentMethod,
      description
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!paymentDate || !concept || amount === undefined || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Los campos fecha de pago, concepto, importe y forma de pago son obligatorios'
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

    // Crear nueva compra
    const newBuy = new Buy({
      paymentDate,
      user: userId,
      concept,
      amount,
      paymentMethod,
      description: description || '',
      branch: userBranch._id
    });

    const savedBuy = await newBuy.save();

    // Popular la compra guardada antes de devolverla
    const populatedBuy = await Buy.findById(savedBuy._id)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('paymentMethod', 'name abbreviation');

    res.status(201).json({
      success: true,
      data: populatedBuy,
      message: 'Compra creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear compra:', error);

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

// Actualizar una compra
const updateBuy = async (req, res) => {
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

    // Verificar si la compra existe
    const existingBuy = await Buy.findById(id);
    if (!existingBuy) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Verificar que el usuario tenga permiso para editar esta compra
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(existingBuy.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta compra'
      });
    }

    // No permitir actualizar ciertos campos
    delete updateData.folio;
    delete updateData.branch;
    delete updateData.user;

    // Validar que el método de pago existe si se está actualizando
    if (updateData.paymentMethod) {
      const paymentMethodExists = await PaymentMethod.findById(updateData.paymentMethod);
      if (!paymentMethodExists) {
        return res.status(400).json({
          success: false,
          message: 'El método de pago seleccionado no existe'
        });
      }
    }

    const updatedBuy = await Buy.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('paymentMethod', 'name abbreviation');

    res.status(200).json({
      success: true,
      data: updatedBuy,
      message: 'Compra actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar compra:', error);

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

// Eliminar una compra
const deleteBuy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const buy = await Buy.findById(id);

    if (!buy) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Verificar que el usuario tenga permiso para eliminar esta compra
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(buy.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta compra'
      });
    }

    await Buy.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Compra eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllBuys,
  getBuyById,
  createBuy,
  updateBuy,
  deleteBuy
};
