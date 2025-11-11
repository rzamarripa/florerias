import { Expense } from '../models/Expense.js';
import { Branch } from '../models/Branch.js';
import CashRegister from '../models/CashRegister.js';
import mongoose from 'mongoose';

// Obtener todos los gastos con filtros y paginación
const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      expenseType,
      startDate,
      endDate,
      branchId
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
      branch: { $in: branchIds } // Filtrar solo gastos de sucursales donde el usuario es administrador o gerente
    };

    if (expenseType) {
      filters.expenseType = expenseType;
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

    // Obtener gastos con paginación
    const expenses = await Expense.find(filters)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('cashRegister', 'name currentBalance')
      .populate('concept', 'name description department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await Expense.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un gasto por ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const expense = await Expense.findById(id)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('cashRegister', 'name currentBalance')
      .populate('concept', 'name description department');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para ver este gasto
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(expense.branch._id));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este gasto'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error al obtener gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear un nuevo gasto
const createExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      paymentDate,
      concept,
      total,
      expenseType,
      cashRegisterId,
      branchId // ID de la sucursal seleccionada (para administradores)
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Validar campos requeridos
    if (!paymentDate || !concept || total === undefined || !expenseType) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Los campos fecha de pago, concepto, total y tipo de gasto son obligatorios'
      });
    }

    // Validar tipo de gasto
    if (!['check_transfer', 'petty_cash'].includes(expenseType)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Tipo de gasto inválido. Debe ser "check_transfer" o "petty_cash"'
      });
    }

    // Validar cashRegisterId si es tipo petty_cash
    if (expenseType === 'petty_cash' && !cashRegisterId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'El campo caja registradora es obligatorio para gastos de caja chica'
      });
    }

    // Determinar la sucursal a utilizar
    let userBranch;

    if (branchId) {
      // Si se proporciona branchId (administrador con sucursal seleccionada), usarlo
      userBranch = await Branch.findById(branchId);

      if (!userBranch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'La sucursal seleccionada no existe'
        });
      }

      // Verificar que el usuario tenga permisos sobre esta sucursal
      const isAdminOfBranch = userBranch.administrator && userBranch.administrator.equals(userId);
      const isManagerOfBranch = userBranch.manager && userBranch.manager.equals(userId);

      if (!isAdminOfBranch && !isManagerOfBranch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para crear gastos en esta sucursal'
        });
      }
    } else {
      // Si no se proporciona branchId, buscar la sucursal del usuario (comportamiento original para gerentes)
      userBranch = await Branch.findOne({
        $or: [
          { administrator: userId },
          { manager: userId }
        ]
      });

      if (!userBranch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          success: false,
          message: 'El usuario no está asignado como administrador o gerente de ninguna sucursal'
        });
      }
    }

    let cashRegister = null;

    // Si es gasto de caja chica, validar y actualizar la caja
    if (expenseType === 'petty_cash') {
      cashRegister = await CashRegister.findById(cashRegisterId).session(session);

      if (!cashRegister) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Caja registradora no encontrada'
        });
      }

      // Obtener la sucursal de la caja para verificar permisos
      const cashRegisterBranch = await Branch.findById(cashRegister.branchId).session(session);

      if (!cashRegisterBranch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'La sucursal de la caja no fue encontrada'
        });
      }

      // Validar permisos: el usuario debe ser gerente de la caja O administrador/gerente de la sucursal de la caja
      const isManagerOfCashRegister = cashRegister.managerId && cashRegister.managerId.equals(userId);
      const isAdminOfBranch = cashRegisterBranch.administrator && cashRegisterBranch.administrator.equals(userId);
      const isManagerOfBranch = cashRegisterBranch.manager && cashRegisterBranch.manager.equals(userId);

      if (!isManagerOfCashRegister && !isAdminOfBranch && !isManagerOfBranch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para usar esta caja registradora'
        });
      }

      // Validar que haya saldo suficiente
      if (cashRegister.currentBalance < total) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Saldo insuficiente en la caja. Saldo actual: $${cashRegister.currentBalance.toFixed(2)}`
        });
      }
    }

    // Crear nuevo gasto
    const newExpense = new Expense({
      paymentDate,
      user: userId,
      concept,
      total,
      expenseType,
      branch: userBranch._id,
      ...(expenseType === 'petty_cash' && { cashRegister: cashRegisterId })
    });

    const savedExpense = await newExpense.save({ session });

    // Si es gasto de caja chica, actualizar el balance y agregar al array de gastos
    if (expenseType === 'petty_cash' && cashRegister) {
      cashRegister.currentBalance -= total;
      cashRegister.expenses.push(savedExpense._id);
      await cashRegister.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Popular el gasto guardado antes de devolverlo
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('cashRegister', 'name currentBalance')
      .populate('concept', 'name description department');

    res.status(201).json({
      success: true,
      data: populatedExpense,
      message: 'Gasto creado exitosamente'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error al crear gasto:', error);

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

// Actualizar un gasto
const updateExpense = async (req, res) => {
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

    // Verificar si el gasto existe
    const existingExpense = await Expense.findById(id);
    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para editar este gasto
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(existingExpense.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este gasto'
      });
    }

    // No permitir actualizar ciertos campos
    delete updateData.folio;
    delete updateData.branch;
    delete updateData.user;

    // Validar tipo de gasto si se está actualizando
    if (updateData.expenseType && !['check_transfer', 'petty_cash'].includes(updateData.expenseType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de gasto inválido. Debe ser "check_transfer" o "petty_cash"'
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'username email profile')
      .populate('branch', 'branchName branchCode')
      .populate('cashRegister', 'name currentBalance')
      .populate('concept', 'name description department');

    res.status(200).json({
      success: true,
      data: updatedExpense,
      message: 'Gasto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar gasto:', error);

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

// Eliminar un gasto
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para eliminar este gasto
    const userBranches = await Branch.find({
      $or: [
        { administrator: userId },
        { manager: userId }
      ]
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);
    const hasAccess = branchIds.some(branchId => branchId.equals(expense.branch));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este gasto'
      });
    }

    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Gasto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};
