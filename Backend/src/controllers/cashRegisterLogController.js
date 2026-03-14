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
      // Los gerentes ven logs de cajas donde son managerId
      filters.managerId = userId;
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

// Obtener un log específico por ID y transformarlo al formato CashRegisterSummary
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

    // Transformar el log al formato CashRegisterSummary para compatibilidad con el frontend
    const summary = {
      cashRegister: {
        _id: log.cashRegisterId?._id || log.cashRegisterId,
        name: log.cashRegisterName || log.cashRegisterId?.name || 'N/A',
        branchId: log.branchId,
        cashierId: log.cashierId,
        managerId: log.managerId,
        isOpen: false, // Los logs son de cajas cerradas
        lastOpen: log.openedAt
      },
      totals: {
        initialBalance: log.totals?.initialBalance || 0,
        totalSales: log.totals?.totalSales || 0,
        totalExpenses: log.totals?.totalExpenses || 0,
        currentBalance: log.totals?.finalBalance || 0,
        remainingBalance: log.totals?.remainingBalance || 0
      },
      salesByPaymentType: log.salesByPaymentType || {
        efectivo: 0,
        credito: 0,
        transferencia: 0,
        intercambio: 0
      },
      // Mapear orders al formato esperado
      orders: (log.orders || []).map(order => ({
        _id: order.orderId?._id || order.orderId,
        orderNumber: order.orderNumber,
        clientName: order.clientName || 'N/A',
        recipientName: order.recipientName || 'N/A',
        total: order.total || 0,
        advance: order.advance || 0,
        discount: order.discount || 0,
        discountType: order.discountType,
        shippingType: order.shippingType || 'N/A',
        paymentMethod: order.paymentMethod || 'N/A',
        status: order.status || 'N/A',
        createdAt: order.saleDate,
        itemsCount: order.itemsCount || 0,
        sendToProduction: order.sendToProduction || false
      })),
      // Incluir los nuevos campos si existen
      ordersByPaymentMethod: log.ordersByPaymentMethod || {},
      paymentsByMethod: log.paymentsByMethod || {},
      // Mapear gastos al formato esperado
      expenses: (log.expenses || []).map(expense => ({
        _id: expense._id,
        folio: expense.folio || 0,
        concept: expense.expenseConcept || 'N/A',
        conceptDescription: expense.conceptDescription || '',
        total: expense.amount || 0,
        paymentDate: expense.expenseDate,
        user: expense.user || 'N/A',
        expenseType: expense.expenseType || 'N/A'
      })),
      // Mapear compras al formato esperado
      buys: (log.buys || []).map(buy => ({
        _id: buy.buyId || buy._id,
        folio: buy.folio || 0,
        concept: buy.concept || 'N/A',
        conceptDescription: buy.conceptDescription || '',
        amount: buy.amount || 0,
        paymentDate: buy.paymentDate,
        paymentMethod: buy.paymentMethod || 'N/A',
        provider: buy.provider || 'N/A',
        user: buy.user || 'N/A',
        description: buy.description || ''
      })),
      // Mapear autorizaciones de descuento
      discountAuths: (log.discountAuths || []).map(auth => ({
        _id: auth.authId || auth._id,
        orderId: auth.orderId,
        orderNumber: auth.orderNumber || 'N/A',
        message: auth.message || '',
        requestedBy: auth.requestedBy || 'N/A',
        managerId: auth.managerId || 'N/A',
        discountValue: auth.discountValue || 0,
        discountType: auth.discountType,
        discountAmount: auth.discountAmount || 0,
        isAuth: auth.isAuth,
        authFolio: auth.authFolio,
        isRedeemed: auth.isRedeemed || false,
        createdAt: auth.createdAt,
        approvedAt: auth.approvedAt
      })),
      // Incluir órdenes canceladas si existen
      canceledOrders: (log.canceledOrders || []).map(order => ({
        _id: order.orderId || order._id,
        orderNumber: order.orderNumber,
        clientName: order.clientName || 'N/A',
        recipientName: order.recipientName || 'N/A',
        total: order.total || 0,
        advance: order.advance || 0,
        discount: order.discount || 0,
        discountType: order.discountType,
        shippingType: order.shippingType || 'N/A',
        paymentMethod: order.paymentMethod || 'N/A',
        status: order.status || 'cancelado',
        createdAt: order.createdAt || order.saleDate,
        itemsCount: order.itemsCount || 0,
        sendToProduction: order.sendToProduction || false
      })),
      // Incluir descuentos autorizados si existen
      authorizedDiscounts: (log.authorizedDiscounts || []).map(auth => ({
        _id: auth.authId || auth._id,
        orderId: auth.orderId,
        orderNumber: auth.orderNumber || 'N/A',
        message: auth.message || '',
        requestedBy: auth.requestedBy || 'N/A',
        managerId: auth.managerId || 'N/A',
        discountValue: auth.discountValue || 0,
        discountType: auth.discountType,
        discountAmount: auth.discountAmount || 0,
        isAuth: auth.isAuth !== undefined ? auth.isAuth : true, // Default true para authorized
        authFolio: auth.authFolio,
        isRedeemed: auth.isRedeemed || false,
        createdAt: auth.createdAt,
        approvedAt: auth.approvedAt
      })),
      // Metadata del log
      logMetadata: {
        closedAt: log.closedAt,
        openedAt: log.openedAt,
        logId: log._id
      }
    };

    res.status(200).json({
      success: true,
      data: summary
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
    if (userRole === 'cajero' || userRole === 'cashier') {
      // Cajeros ven cajas de su sucursal
      const userBranches = await Branch.find({ employees: userId }).select('_id');
      const branchIds = userBranches.map(branch => branch._id);

      if (branchIds.length > 0) {
        filters.branchId = { $in: branchIds };
      } else {
        filters._id = null;
      }
    } else if (userRole === 'gerente' || userRole === 'manager') {
      // Gerentes ven cajas donde son managerId
      filters.managerId = userId;
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
