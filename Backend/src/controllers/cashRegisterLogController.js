import CashRegisterLog from '../models/CashRegisterLog.js';
import CashRegister from '../models/CashRegister.js';
import { Branch } from '../models/Branch.js';

// Obtener todos los logs de caja con filtros y paginación
const getAllCashRegisterLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      cashRegisterId,
      branchId,
      startDate,
      endDate
    } = req.query;

    // Obtener el ID del usuario desde el token
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el rol del usuario
    const userRole = req.user?.role?.name?.toLowerCase();

    // Construir filtros
    const filters = {};

    // Aplicar filtros según el rol
    if (userRole === 'cajero' || userRole === 'cashier' || userRole === 'redes') {
      // Los cajeros y usuarios de redes ven solo sus propios logs (filtrados por cashierId)
      filters.cashierId = userId;
    } else if (userRole === 'gerente' || userRole === 'manager') {
      // Los gerentes ven logs de cajas de su sucursal
      const userBranches = await Branch.find({ employees: userId }).select('_id');
      const branchIds = userBranches.map(branch => branch._id);

      if (branchIds.length > 0) {
        filters.branchId = { $in: branchIds };
      } else {
        // Si no tiene sucursales asignadas, no ver ningún log
        filters._id = null;
      }
    } else if (userRole === 'admin' || userRole === 'administrador') {
      // Los administradores ven logs de todas sus sucursales
      const userBranches = await Branch.find({ adminId: userId }).select('_id');
      const branchIds = userBranches.map(branch => branch._id);

      if (branchIds.length > 0) {
        filters.branchId = { $in: branchIds };
      }
    }
    // Si es Super Admin, puede ver todos los logs (no se aplica filtro)

    // Filtro opcional por sucursal específica (enviado desde el frontend)
    if (branchId) {
      filters.branchId = branchId;
    }

    // Filtro por caja registradora específica
    if (cashRegisterId) {
      filters.cashRegisterId = cashRegisterId;
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      filters.closedAt = {};
      if (startDate) {
        filters.closedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filters.closedAt.$lte = endDateTime;
      }
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener logs con paginación
    const logs = await CashRegisterLog.find(filters)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('cashRegisterId', 'name')
      .sort({ closedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de documentos
    const total = await CashRegisterLog.countDocuments(filters);
    const pages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error al obtener logs de cajas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener un log específico por ID
const getCashRegisterLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await CashRegisterLog.findById(id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('cashRegisterId', 'name')
      .populate('orders.orderId', 'orderNumber');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log de caja no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error al obtener log de caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener cajas registradoras disponibles para el usuario
const getUserCashRegisters = async (req, res) => {
  try {
    // Obtener el ID del usuario desde el token
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el rol del usuario
    const userRole = req.user?.role?.name?.toLowerCase();

    // Construir filtros
    const filters = { isActive: true };

    // Aplicar filtros según el rol
    if (userRole === 'cajero' || userRole === 'cashier' || userRole === 'gerente' || userRole === 'manager') {
      // Cajeros y gerentes ven cajas de su sucursal
      const userBranches = await Branch.find({ employees: userId }).select('_id');
      const branchIds = userBranches.map(branch => branch._id);

      if (branchIds.length > 0) {
        filters.branchId = { $in: branchIds };
      } else {
        filters._id = null;
      }
    } else if (userRole === 'admin' || userRole === 'administrador') {
      // Administradores ven cajas de sus sucursales
      const userBranches = await Branch.find({ adminId: userId }).select('_id');
      const branchIds = userBranches.map(branch => branch._id);

      if (branchIds.length > 0) {
        filters.branchId = { $in: branchIds };
      }
    }
    // Si es Super Admin, puede ver todas las cajas (no se aplica filtro adicional)

    const cashRegisters = await CashRegister.find(filters)
      .populate('branchId', 'branchName branchCode')
      .select('_id name branchId')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: cashRegisters
    });
  } catch (error) {
    console.error('Error al obtener cajas registradoras del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllCashRegisterLogs,
  getCashRegisterLogById,
  getUserCashRegisters
};
