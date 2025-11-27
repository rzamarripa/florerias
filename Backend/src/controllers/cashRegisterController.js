import CashRegister from '../models/CashRegister.js';
import CashRegisterLog from '../models/CashRegisterLog.js';
import { Branch } from '../models/Branch.js';
import { Expense } from '../models/Expense.js';
import { Buy } from '../models/Buy.js';
import OrderPayment from '../models/OrderPayment.js';
import PaymentMethod from '../models/PaymentMethod.js';

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

    // Filtrar solo cajas normales (no de redes sociales)
    filters.isSocialMediaBox = false;

    // Aplicar filtros según el rol
    if (userRole === 'cajero' || userRole === 'cashier') {
      // Los cajeros ven todas las cajas de las sucursales donde son empleados
      const userBranches = await Branch.find({ employees: userId }).select('_id');
      const branchIds = userBranches.map(branch => branch._id);

      if (branchIds.length > 0) {
        filters.branchId = { $in: branchIds };
      } else {
        // Si no tiene sucursales asignadas, no ver ninguna caja
        filters._id = null;
      }
    } else if (userRole === 'gerente' || userRole === 'manager') {
      // Los gerentes solo ven las cajas donde son managerId
      filters.managerId = userId;
    }
    // Si es Admin o Super Admin, puede ver todas las cajas (no se aplica filtro de usuario)

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
      managerId,
      initialBalance,
      isSocialMediaBox
    } = req.body;

    // Validar campos requeridos (cashierId es opcional, se asigna al abrir la caja)
    if (!name || !branchId || !managerId) {
      return res.status(400).json({
        success: false,
        message: 'El nombre, sucursal y gerente son obligatorios'
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

    // Obtener companyId solo si es caja de redes sociales
    let companyId = null;
    if (isSocialMediaBox === true) {
      // Obtener el usuario desde el token
      const userId = req.user?._id;
      const userRole = req.user?.role?.name?.toLowerCase();

      if (userRole === 'administrador' || userRole === 'admin' || userRole === 'super admin') {
        // Si es administrador, buscar la empresa donde él es el administrator
        const { Company } = await import('../models/Company.js');
        const company = await Company.findOne({ administrator: userId });
        if (company) {
          companyId = company._id;
        }
      } else if (userRole === 'gerente' || userRole === 'manager') {
        // Si es gerente, buscar su sucursal y luego la empresa
        const managerBranch = await Branch.findOne({ manager: userId });
        if (managerBranch) {
          const { Company } = await import('../models/Company.js');
          const company = await Company.findOne({ branches: managerBranch._id });
          if (company) {
            companyId = company._id;
          }
        }
      }

      // Validar que se haya encontrado la empresa para cajas de redes sociales
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo determinar la empresa para esta caja de redes sociales'
        });
      }
    }

    // Crear nueva caja registradora (cashierId se asigna al abrir la caja)
    const newCashRegister = new CashRegister({
      name,
      branchId,
      cashierId: null,
      managerId,
      currentBalance: parsedInitialBalance,
      initialBalance: parsedInitialBalance,
      isOpen: false,
      isSocialMediaBox: isSocialMediaBox === true,
      companyId: companyId, // Solo se guarda si es caja de redes sociales
      lastRegistry: [],
      lastOpen: null
    });

    const savedCashRegister = await newCashRegister.save();

    // Popular la caja registradora guardada antes de devolverla
    const populatedCashRegister = await CashRegister.findById(savedCashRegister._id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('companyId', 'legalName tradeName')
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

// Abrir/Cerrar caja (solo cajeros)
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

    // Obtener el ID del usuario desde el token (req.user debe estar disponible por middleware de autenticación)
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Preparar datos de actualización
    const updateData = { isOpen };

    // Si se está abriendo la caja (isOpen = true), asignar el usuario actual como cajero
    if (isOpen === true) {
      updateData.cashierId = userId;
    }

    // Si se está cerrando la caja (isOpen = false), limpiar cashierId y actualizar lastOpen
    if (isOpen === false) {
      updateData.cashierId = null;
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

    // Extraer cajeros, gerentes y usuarios de redes sociales
    const cashiers = [];
    const managers = [];
    const socialMediaUsers = [];
    const cashierIds = new Set();
    const managerIds = new Set();
    const socialMediaIds = new Set();

    branches.forEach(branch => {
      // Agregar gerente de la sucursal
      if (branch.manager && !managerIds.has(branch.manager._id.toString())) {
        managers.push(branch.manager);
        managerIds.add(branch.manager._id.toString());
      }

      // Filtrar empleados que sean cajeros o de redes sociales
      if (branch.employees && branch.employees.length > 0) {
        branch.employees.forEach(employee => {
          if (employee.role && employee.role.name === 'Cajero' && !cashierIds.has(employee._id.toString())) {
            cashiers.push(employee);
            cashierIds.add(employee._id.toString());
          }
          if (employee.role && employee.role.name === 'Redes' && !socialMediaIds.has(employee._id.toString())) {
            socialMediaUsers.push(employee);
            socialMediaIds.add(employee._id.toString());
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        cashiers,
        managers,
        socialMediaUsers,
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

// Obtener sucursal del gerente
const getManagerBranch = async (req, res) => {
  try {
    const { managerId } = req.params;

    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del gerente es requerido'
      });
    }

    // Buscar sucursal donde el usuario sea manager
    const branch = await Branch.findOne({ manager: managerId })
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

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró sucursal para este gerente'
      });
    }

    // Extraer cajeros y usuarios de redes sociales
    const cashiers = [];
    const socialMediaUsers = [];
    const cashierIds = new Set();
    const socialMediaIds = new Set();

    if (branch.employees && branch.employees.length > 0) {
      branch.employees.forEach(employee => {
        if (employee.role && employee.role.name === 'Cajero' && !cashierIds.has(employee._id.toString())) {
          cashiers.push(employee);
          cashierIds.add(employee._id.toString());
        }
        if (employee.role && employee.role.name === 'Redes' && !socialMediaIds.has(employee._id.toString())) {
          socialMediaUsers.push(employee);
          socialMediaIds.add(employee._id.toString());
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cashiers,
        managers: [branch.manager],
        socialMediaUsers,
        branches: [{
          _id: branch._id,
          branchName: branch.branchName,
          branchCode: branch.branchCode
        }]
      }
    });
  } catch (error) {
    console.error('Error al obtener sucursal del gerente:', error);
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

// Obtener resumen de la caja registradora para cierre
const getCashRegisterSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la caja registradora
    const cashRegister = await CashRegister.findById(id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate({
        path: 'lastRegistry.orderId',
        select: 'orderNumber total advance shippingType clientInfo deliveryData createdAt status items paymentMethod',
        populate: {
          path: 'paymentMethod',
          select: 'name'
        }
      })
      .populate({
        path: 'buys',
        populate: [
          { path: 'user', select: 'username email profile' },
          { path: 'provider', select: 'businessName tradeName' },
          { path: 'concept', select: 'name description' },
          { path: 'paymentMethod', select: 'name' }
        ]
      })
      .populate({
        path: 'expenses',
        populate: [
          { path: 'user', select: 'username email profile' },
          { path: 'concept', select: 'name description' }
        ]
      });

    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    // Calcular totales
    const initialBalance = cashRegister.initialBalance;
    let totalSales = 0;
    let totalExpenses = 0;

    // Obtener todos los IDs de pagos de las órdenes registradas en esta caja
    const paymentIds = [];
    cashRegister.lastRegistry.forEach(reg => {
      if (reg.paymentIds && reg.paymentIds.length > 0) {
        paymentIds.push(...reg.paymentIds);
      }
    });

    // Buscar todos los pagos de OrderPayment
    const allPayments = await OrderPayment.find({
      _id: { $in: paymentIds }
    })
      .populate({
        path: 'paymentMethod',
        select: 'name'
      })
      .populate({
        path: 'orderId',
        select: 'orderNumber total shippingType clientInfo deliveryData createdAt status items'
      });

    // Determinar qué pagos contar según el tipo de caja
    let relevantPayments = [];
    if (cashRegister.isSocialMediaBox) {
      // Cajas de redes sociales: todos los pagos EXCEPTO efectivo
      relevantPayments = allPayments.filter(payment => {
        const paymentMethodName = payment.paymentMethod?.name?.toLowerCase() || '';
        return !paymentMethodName.includes('efectivo');
      });
    } else {
      // Cajas normales: solo pagos en efectivo
      relevantPayments = allPayments.filter(payment => {
        const paymentMethodName = payment.paymentMethod?.name?.toLowerCase() || '';
        return paymentMethodName.includes('efectivo');
      });
    }

    // Calcular total de ventas según el tipo de caja
    totalSales = relevantPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Obtener gastos desde el array de expenses de la caja (solo de la sesión actual)
    const expensesFromDB = cashRegister.expenses || [];

    // Calcular total de gastos desde el array de expenses
    totalExpenses = expensesFromDB.reduce((sum, expense) => sum + (expense.total || 0), 0);

    // Obtener compras en efectivo desde el array de buys de la caja
    const cashBuys = cashRegister.buys || [];

    // Agrupar pagos por orden para el detalle
    const ordersMap = new Map();
    relevantPayments.forEach(payment => {
      if (payment.orderId) {
        const orderId = payment.orderId._id.toString();
        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, {
            _id: payment.orderId._id,
            orderNumber: payment.orderId.orderNumber,
            clientName: payment.orderId.clientInfo?.name || 'N/A',
            recipientName: payment.orderId.deliveryData?.recipientName || 'N/A',
            total: payment.orderId.total,
            totalPaid: 0,
            shippingType: payment.orderId.shippingType,
            paymentMethods: new Set(),
            status: payment.orderId.status,
            createdAt: payment.orderId.createdAt || payment.date,
            itemsCount: payment.orderId.items?.length || 0
          });
        }
        // Sumar el monto del pago
        const order = ordersMap.get(orderId);
        order.totalPaid += payment.amount;
        // Agregar método de pago al conjunto
        if (payment.paymentMethod?.name) {
          order.paymentMethods.add(payment.paymentMethod.name);
        }
      }
    });

    // Convertir el Map a array
    const ordersArray = Array.from(ordersMap.values());

    const summary = {
      cashRegister: {
        _id: cashRegister._id,
        name: cashRegister.name,
        branchId: cashRegister.branchId,
        cashierId: cashRegister.cashierId,
        managerId: cashRegister.managerId,
        isOpen: cashRegister.isOpen,
        lastOpen: cashRegister.lastOpen
      },
      totals: {
        initialBalance,
        totalSales, // Pagos en efectivo (cajas normales) o no efectivo (cajas redes sociales)
        totalExpenses,
        currentBalance: cashRegister.currentBalance
      },
      orders: ordersArray.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        recipientName: order.recipientName,
        total: order.total,
        advance: order.totalPaid, // Total pagado en esta caja
        shippingType: order.shippingType,
        paymentMethod: Array.from(order.paymentMethods).join(', ') || 'N/A',
        status: order.status,
        createdAt: order.createdAt,
        itemsCount: order.itemsCount
      })),
      expenses: expensesFromDB.map(expense => ({
        _id: expense._id,
        folio: expense.folio,
        concept: expense.concept?.name || 'N/A',
        conceptDescription: expense.concept?.description || '',
        total: expense.total,
        paymentDate: expense.paymentDate,
        user: expense.user?.profile?.fullName || expense.user?.username || 'N/A',
        expenseType: expense.expenseType
      })),
      buys: cashBuys.map(buy => ({
        _id: buy._id,
        folio: buy.folio,
        concept: buy.concept?.name || 'N/A',
        conceptDescription: buy.concept?.description || '',
        amount: buy.amount,
        paymentDate: buy.paymentDate,
        paymentMethod: buy.paymentMethod?.name || 'N/A',
        provider: buy.provider?.tradeName || buy.provider?.businessName || 'N/A',
        user: buy.user?.profile?.fullName || buy.user?.username || 'N/A',
        description: buy.description || ''
      }))
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error al obtener resumen de caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Cerrar caja y reiniciar datos
const closeCashRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const { remainingBalance } = req.body;

    // Validar que remainingBalance esté presente
    if (remainingBalance === undefined || remainingBalance === null) {
      return res.status(400).json({
        success: false,
        message: 'El saldo restante es requerido'
      });
    }

    const parsedRemainingBalance = Number(remainingBalance);

    // Validar que sea un número válido
    if (isNaN(parsedRemainingBalance) || parsedRemainingBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'El saldo restante debe ser un número válido no negativo'
      });
    }

    // Obtener la caja registradora con todos los datos necesarios para el log
    const cashRegister = await CashRegister.findById(id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate({
        path: 'lastRegistry.orderId',
        select: 'orderNumber total advance shippingType clientInfo deliveryData createdAt status items paymentMethod',
        populate: {
          path: 'paymentMethod',
          select: 'name'
        }
      })
      .populate({
        path: 'expenses',
        populate: [
          { path: 'user', select: 'username email profile' },
          { path: 'concept', select: 'name description' }
        ]
      })
      .populate({
        path: 'buys',
        populate: [
          { path: 'user', select: 'username email profile' },
          { path: 'provider', select: 'businessName tradeName' },
          { path: 'concept', select: 'name description' },
          { path: 'paymentMethod', select: 'name' }
        ]
      });

    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    // Verificar que la caja esté abierta
    if (!cashRegister.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'La caja ya está cerrada'
      });
    }

    // Calcular totales para el log
    const initialBalance = Number(cashRegister.initialBalance) || 0;

    // Obtener todos los IDs de pagos
    const paymentIds = [];
    cashRegister.lastRegistry.forEach(reg => {
      if (reg.paymentIds && reg.paymentIds.length > 0) {
        paymentIds.push(...reg.paymentIds);
      }
    });

    // Buscar todos los pagos de OrderPayment
    const allPayments = await OrderPayment.find({
      _id: { $in: paymentIds }
    })
      .populate('paymentMethod', 'name')
      .populate('orderId', 'orderNumber total shippingType clientInfo deliveryData createdAt status items');

    // Determinar qué pagos contar según el tipo de caja
    let relevantPayments = [];
    if (cashRegister.isSocialMediaBox) {
      // Cajas de redes sociales: todos los pagos EXCEPTO efectivo
      relevantPayments = allPayments.filter(payment => {
        const paymentMethodName = payment.paymentMethod?.name?.toLowerCase() || '';
        return !paymentMethodName.includes('efectivo');
      });
    } else {
      // Cajas normales: solo pagos en efectivo
      relevantPayments = allPayments.filter(payment => {
        const paymentMethodName = payment.paymentMethod?.name?.toLowerCase() || '';
        return paymentMethodName.includes('efectivo');
      });
    }

    // Calcular total de ventas
    const totalSales = relevantPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const totalExpenses = cashRegister.expenses.reduce((sum, expense) => {
      const total = Number(expense.total) || 0;
      return sum + total;
    }, 0);
    const finalBalance = Number(cashRegister.currentBalance) || 0;

    // Validar que el saldo restante no sea mayor al saldo actual de la caja
    if (parsedRemainingBalance > finalBalance) {
      return res.status(400).json({
        success: false,
        message: `El saldo restante ($${parsedRemainingBalance.toFixed(2)}) no puede ser mayor al saldo actual de la caja ($${finalBalance.toFixed(2)})`
      });
    }

    // Calcular totales por método de pago
    const salesByPaymentType = {
      efectivo: 0,
      credito: 0,
      transferencia: 0,
      intercambio: 0
    };

    relevantPayments.forEach(payment => {
      const paymentMethodName = payment.paymentMethod?.name?.toLowerCase() || '';
      const amount = Number(payment.amount) || 0;

      if (paymentMethodName.includes('efectivo')) {
        salesByPaymentType.efectivo += amount;
      } else if (paymentMethodName.includes('crédito') || paymentMethodName.includes('credito') || paymentMethodName.includes('tarjeta')) {
        salesByPaymentType.credito += amount;
      } else if (paymentMethodName.includes('transferencia') || paymentMethodName.includes('depósito') || paymentMethodName.includes('deposito')) {
        salesByPaymentType.transferencia += amount;
      } else if (paymentMethodName.includes('intercambio')) {
        salesByPaymentType.intercambio += amount;
      } else {
        salesByPaymentType.efectivo += amount;
      }
    });

    // Agrupar pagos por orden para el log
    const ordersMapForLog = new Map();
    relevantPayments.forEach(payment => {
      if (payment.orderId) {
        const orderId = payment.orderId._id.toString();
        if (!ordersMapForLog.has(orderId)) {
          ordersMapForLog.set(orderId, {
            orderId: payment.orderId._id,
            orderNumber: payment.orderId.orderNumber,
            clientName: payment.orderId.clientInfo?.name || 'N/A',
            recipientName: payment.orderId.deliveryData?.recipientName || 'N/A',
            total: Number(payment.orderId.total) || 0,
            advance: 0,
            shippingType: payment.orderId.shippingType,
            paymentMethods: new Set(),
            status: payment.orderId.status,
            saleDate: payment.orderId.createdAt || payment.date,
            itemsCount: payment.orderId.items?.length || 0
          });
        }
        const order = ordersMapForLog.get(orderId);
        order.advance += payment.amount;
        if (payment.paymentMethod?.name) {
          order.paymentMethods.add(payment.paymentMethod.name);
        }
      }
    });

    const ordersArrayForLog = Array.from(ordersMapForLog.values());

    // Crear el log del cierre de caja
    const cashRegisterLog = new CashRegisterLog({
      cashRegisterId: cashRegister._id,
      cashRegisterName: cashRegister.name,
      branchId: cashRegister.branchId._id,
      cashierId: cashRegister.cashierId?._id || null,
      managerId: cashRegister.managerId._id,
      openedAt: cashRegister.lastOpen,
      closedAt: new Date(),
      totals: {
        initialBalance,
        totalSales,
        totalExpenses,
        finalBalance,
        remainingBalance: parsedRemainingBalance
      },
      salesByPaymentType,
      orders: ordersArrayForLog.map(order => ({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        recipientName: order.recipientName,
        total: order.total,
        advance: order.advance,
        shippingType: order.shippingType,
        paymentMethod: Array.from(order.paymentMethods).join(', ') || 'N/A',
        status: order.status,
        saleDate: order.saleDate,
        itemsCount: order.itemsCount
      })),
      expenses: (cashRegister.expenses || []).map(expense => ({
        expenseConcept: expense.concept?.name || 'N/A',
        amount: Number(expense.total) || 0,
        expenseDate: expense.paymentDate
      })),
      buys: (cashRegister.buys || []).map(buy => ({
        buyId: buy._id,
        folio: buy.folio,
        concept: buy.concept?.name || 'N/A',
        conceptDescription: buy.concept?.description || '',
        amount: Number(buy.amount) || 0,
        paymentDate: buy.paymentDate,
        paymentMethod: buy.paymentMethod?.name || 'N/A',
        provider: buy.provider?.tradeName || buy.provider?.businessName || 'N/A',
        user: buy.user?.profile?.fullName || buy.user?.username || 'N/A',
        description: buy.description || ''
      }))
    });

    // Guardar el log
    await cashRegisterLog.save();

    // Actualizar caja registradora - cerrar y reiniciar datos con el saldo restante
    cashRegister.isOpen = false;
    cashRegister.cashierId = null;
    cashRegister.currentBalance = parsedRemainingBalance;
    cashRegister.initialBalance = parsedRemainingBalance;
    cashRegister.lastRegistry = [];
    cashRegister.expenses = [];
    cashRegister.buys = [];
    cashRegister.lastOpen = new Date();

    await cashRegister.save();

    // Popular la caja registradora actualizada
    const updatedCashRegister = await CashRegister.findById(id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total');

    res.status(200).json({
      success: true,
      data: updatedCashRegister,
      message: 'Caja cerrada y reiniciada exitosamente'
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Registrar un gasto en la caja registradora
const registerExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseConcept, amount } = req.body;

    // Validar campos requeridos
    if (!expenseConcept || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'El concepto y el monto del gasto son obligatorios'
      });
    }

    // Validar que el monto sea válido
    const parsedAmount = parseFloat(amount);
    if (parsedAmount < 0 || isNaN(parsedAmount)) {
      return res.status(400).json({
        success: false,
        message: 'El monto del gasto debe ser un número positivo'
      });
    }

    // Verificar si la caja registradora existe
    const cashRegister = await CashRegister.findById(id);
    if (!cashRegister) {
      return res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada'
      });
    }

    // Verificar que la caja esté abierta
    if (!cashRegister.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'La caja debe estar abierta para registrar gastos'
      });
    }

    // Verificar que haya suficiente saldo
    if (cashRegister.currentBalance < parsedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente en la caja para registrar este gasto'
      });
    }

    // Crear objeto de gasto
    const expense = {
      expenseConcept: expenseConcept.trim(),
      amount: parsedAmount,
      expenseDate: new Date()
    };

    // Agregar el gasto al arreglo y actualizar el saldo
    cashRegister.expenses.push(expense);
    cashRegister.currentBalance -= parsedAmount;

    // Guardar cambios
    await cashRegister.save();

    // Popular la caja registradora actualizada
    const updatedCashRegister = await CashRegister.findById(id)
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('lastRegistry.orderId', 'orderNumber total');

    res.status(200).json({
      success: true,
      data: updatedCashRegister,
      message: 'Gasto registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar gasto:', error);

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

// Obtener cajas abiertas por sucursal
const getOpenCashRegistersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la sucursal es requerido'
      });
    }

    // Buscar cajas que estén abiertas y activas en la sucursal especificada
    const cashRegisters = await CashRegister.find({
      branchId,
      isOpen: true,
      isActive: true
    })
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .select('_id name branchId cashierId managerId currentBalance isOpen')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: cashRegisters
    });
  } catch (error) {
    console.error('Error al obtener cajas abiertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todas las cajas de redes sociales con filtros y paginación
const getSocialMediaCashRegisters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      branchId,
      isOpen,
      isActive
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

    // Filtrar solo cajas de redes sociales
    filters.isSocialMediaBox = true;

    // Aplicar filtros según el rol
    if (userRole === 'redes' || userRole === 'social media') {
      // Los usuarios de redes ven todas las cajas de redes sociales de su empresa
      // Buscar la empresa donde el usuario es parte del array redes
      const { Company } = await import('../models/Company.js');
      const company = await Company.findOne({ redes: userId });

      if (company) {
        filters.companyId = company._id;
      } else {
        // Si no tiene empresa asignada, no ver ninguna caja
        filters._id = null;
      }
    } else if (userRole === 'gerente' || userRole === 'manager') {
      // Los gerentes ven las cajas de redes sociales de su empresa
      const managerBranch = await Branch.findOne({ manager: userId });
      if (managerBranch) {
        const { Company } = await import('../models/Company.js');
        const company = await Company.findOne({ branches: managerBranch._id });
        if (company) {
          filters.companyId = company._id;
        } else {
          filters._id = null;
        }
      } else {
        filters._id = null;
      }
    } else if (userRole === 'administrador' || userRole === 'admin' || userRole === 'super admin') {
      // Los administradores ven las cajas de redes sociales de su empresa
      const { Company } = await import('../models/Company.js');
      const company = await Company.findOne({ administrator: userId });
      if (company) {
        filters.companyId = company._id;
      }
      // Si es Super Admin sin empresa asignada, puede ver todas las cajas de redes sociales (no se aplica filtro)
    }

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
      .populate('companyId', 'legalName tradeName')
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
    console.error('Error al obtener cajas de redes sociales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener cajas de redes sociales por sucursal
const getSocialMediaCashRegistersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la sucursal es requerido'
      });
    }

    // Buscar cajas de redes sociales activas en la sucursal especificada
    const cashRegisters = await CashRegister.find({
      branchId,
      isSocialMediaBox: true,
      isActive: true
    })
      .populate('branchId', 'branchName branchCode')
      .populate('cashierId', 'username email profile')
      .populate('managerId', 'username email profile')
      .populate('companyId', 'legalName tradeName')
      .select('_id name branchId cashierId managerId currentBalance isOpen isSocialMediaBox companyId')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: cashRegisters
    });
  } catch (error) {
    console.error('Error al obtener cajas de redes sociales por sucursal:', error);
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
  getManagerBranch,
  getUserCashRegister,
  registerExpense,
  getCashRegisterSummary,
  closeCashRegister,
  getOpenCashRegistersByBranch,
  getSocialMediaCashRegisters,
  getSocialMediaCashRegistersByBranch
};
