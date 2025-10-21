import CashRegister from '../models/CashRegister.js';
import { Branch } from '../models/Branch.js';

// Obtener todas las cajas registradoras con filtros y paginación
const getAllCashRegisters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      branchId,
      isOpen,
      isActive
    } = req.query;

    // Construir filtros
    const filters = {};

    if (branchId) {
      filters.branchId = branchId;
    }

    if (isOpen !== undefined) {
      filters.isOpen = isOpen === 'true';
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener cajas registradoras con paginación
    const cashRegisters = await CashRegister.find(filters)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await CashRegister.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: cashRegisters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener cajas registradoras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una caja registradora por ID
const getCashRegisterById = async (req, res) => {
  try {
    const { id } = req.params;

    const cashRegister = await CashRegister.findById(id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total');

    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: cashRegister
    });
  } catch (error) {
    console.error('Error al obtener caja registradora:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear una nueva caja registradora
const createCashRegister = async (req, res) => {
  try {
    const {
      name,
      branchId,
      cashierId,
      managerId,
      initialBalance
    } = req.body;

    // Validar campos requeridos
    if (!name || !branchId || !cashierId || !managerId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Validar que la sucursal exista
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    // Validar que el saldo inicial sea válido si se proporciona
    const parsedInitialBalance = initialBalance !== undefined && initialBalance !== null
      ? parseFloat(initialBalance)
      : 0;

    if (parsedInitialBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'El saldo inicial no puede ser negativo'
      });
    }

    // Crear nueva caja registradora
    const newCashRegister = new CashRegister({
      name,
      branchId,
      cashierId,
      managerId,
      currentBalance: parsedInitialBalance,
      initialBalance: parsedInitialBalance,
      isOpen: false,
      lastRegistry: [],
      lastOpen: null
    });

    const savedCashRegister = await newCashRegister.save();

    // Popular la caja registradora guardada antes de devolverla
    const populatedCashRegister = await CashRegister.findById(savedCashRegister._id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total');

    res.status(201).json({
      success: true,
      data: populatedCashRegister,
      message: 'Caja registradora creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear caja registradora:', error);

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

// Actualizar una caja registradora
const updateCashRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar si la caja registradora existe
    const existingCashRegister = await CashRegister.findById(id);
    if (!existingCashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    // Si se actualiza la sucursal, validar que exista
    if (updateData.branchId) {
      const branch = await Branch.findById(updateData.branchId);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }
    }

    const updatedCashRegister = await CashRegister.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total');

    res.status(200).json({
      success: true,
      data: updatedCashRegister,
      message: 'Caja registradora actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar caja registradora:', error);

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

// Activar/Desactivar una caja registradora (solo administrador)
const toggleActiveCashRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const cashRegister = await CashRegister.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    )
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total');

    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: cashRegister,
      message: `Caja registradora ${isActive ? 'activada' : 'desactivada'} exitosamente`
    });
  } catch (error) {
    console.error('Error al cambiar estado de caja registradora:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Abrir/Cerrar caja (gerentes y cajeros de la misma sucursal)
const toggleOpenCashRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;

    if (isOpen === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    // Preparar datos de actualización
    const updateData = { isOpen };

    // Si se está cerrando la caja (isOpen = false), actualizar lastOpen con la fecha actual
    if (isOpen === false) {
      updateData.lastOpen = new Date();
    }

    const cashRegister = await CashRegister.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total');

    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: cashRegister,
      message: `Caja registradora ${isOpen ? 'abierta' : 'cerrada'} exitosamente`
    });
  } catch (error) {
    console.error('Error al abrir/cerrar caja registradora:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar una caja registradora
const deleteCashRegister = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCashRegister = await CashRegister.findByIdAndDelete(id);

    if (!deletedCashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Caja registradora eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar caja registradora:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener cajeros y gerentes de las sucursales del administrador
const getCashiersAndManagersByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del administrador es requerido'
      });
    }

    // Buscar sucursales donde el administrador coincida
    const branches = await Branch.find({ administrator: adminId })
      .populate({
        path: 'employees',
        populate: {
          path: 'role',
          select: 'name'
        }
      })
      .populate({
        path: 'manager',
        populate: {
          path: 'role',
          select: 'name'
        }
      });

    if (!branches || branches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron sucursales para este administrador'
      });
    }

    // Extraer cajeros y gerentes
    const cashiers = [];
    const managers = [];
    const cashierIds = new Set();
    const managerIds = new Set();

    branches.forEach(branch => {
      // Agregar gerente de la sucursal
      if (branch.manager && !managerIds.has(branch.manager._id.toString())) {
        managers.push(branch.manager);
        managerIds.add(branch.manager._id.toString());
      }

      // Filtrar empleados que sean cajeros
      if (branch.employees && branch.employees.length > 0) {
        branch.employees.forEach(employee => {
          if (employee.role && employee.role.name === 'Cajero' && !cashierIds.has(employee._id.toString())) {
            cashiers.push(employee);
            cashierIds.add(employee._id.toString());
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        cashiers,
        managers,
        branches: branches.map(b => ({
          _id: b._id,
          branchName: b.branchName,
          branchCode: b.branchCode
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener cajeros y gerentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener caja registradora del usuario actual
const getUserCashRegister = async (req, res) => {
  try {
    // Obtener el ID del usuario desde el token
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Buscar caja donde el usuario es cajero o gerente
    let cashRegister = await CashRegister.findOne({
      $or: [
        { cashierId: userId },
        { managerId: userId }
      ],
      isActive: true
    })
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile');

    // Si no se encuentra, retornar null pero con success true
    if (!cashRegister) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No se encontró caja registradora asignada al usuario'
      });
    }

    res.status(200).json({
      success: true,
      data: cashRegister
    });
  } catch (error) {
    console.error('Error al obtener caja registradora del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllCashRegisters,
  getCashRegisterById,
  createCashRegister,
  updateCashRegister,
  toggleActiveCashRegister,
  toggleOpenCashRegister,
  deleteCashRegister,
  getCashiersAndManagersByAdmin,
  getUserCashRegister
};
