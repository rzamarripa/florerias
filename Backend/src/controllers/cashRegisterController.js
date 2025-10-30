import CashRegister from '../models/CashRegister.js';
import CashRegisterLog from '../models/CashRegisterLog.js';
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
      initialBalance
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

    // Crear nueva caja registradora (cashierId se asigna al abrir la caja)
    const newCashRegister = new CashRegister({
      name,
      branchId,
      cashierId: null,
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

    // Calcular total de ventas (suma de advances de todas las órdenes)
    const orders = cashRegister.lastRegistry.map(reg => reg.orderId).filter(order => order !== null);
    totalSales = orders.reduce((sum, order) => sum + (order.advance || 0), 0);

    // Calcular total de gastos
    totalExpenses = cashRegister.expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calcular totales por método de pago
    const salesByPaymentType = {
      efectivo: 0,
      credito: 0,
      transferencia: 0,
      intercambio: 0
    };

    orders.forEach(order => {
      const paymentMethodName = order.paymentMethod?.name?.toLowerCase() || '';
      const advance = order.advance || 0;

      if (paymentMethodName.includes('efectivo')) {
        salesByPaymentType.efectivo += advance;
      } else if (paymentMethodName.includes('crédito') || paymentMethodName.includes('credito') || paymentMethodName.includes('tarjeta')) {
        salesByPaymentType.credito += advance;
      } else if (paymentMethodName.includes('transferencia') || paymentMethodName.includes('depósito') || paymentMethodName.includes('deposito')) {
        salesByPaymentType.transferencia += advance;
      } else if (paymentMethodName.includes('intercambio')) {
        salesByPaymentType.intercambio += advance;
      } else {
        // Si no coincide con ninguna categoría, agregarlo a efectivo por defecto
        salesByPaymentType.efectivo += advance;
      }
    });

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
        totalSales,
        totalExpenses,
        currentBalance: cashRegister.currentBalance
      },
      salesByPaymentType,
      orders: orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        clientName: order.clientInfo?.name || 'N/A',
        recipientName: order.deliveryData?.recipientName || 'N/A',
        total: order.total,
        advance: order.advance,
        shippingType: order.shippingType,
        paymentMethod: order.paymentMethod?.name || 'N/A',
        status: order.status,
        createdAt: order.createdAt,
        itemsCount: order.items?.length || 0
      })),
      expenses: cashRegister.expenses
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
    const initialBalance = cashRegister.initialBalance;
    const orders = cashRegister.lastRegistry.map(reg => reg.orderId).filter(order => order !== null);
    const totalSales = orders.reduce((sum, order) => sum + (order.advance || 0), 0);
    const totalExpenses = cashRegister.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const finalBalance = cashRegister.currentBalance;

    // Calcular totales por método de pago
    const salesByPaymentType = {
      efectivo: 0,
      credito: 0,
      transferencia: 0,
      intercambio: 0
    };

    orders.forEach(order => {
      const paymentMethodName = order.paymentMethod?.name?.toLowerCase() || '';
      const advance = order.advance || 0;

      if (paymentMethodName.includes('efectivo')) {
        salesByPaymentType.efectivo += advance;
      } else if (paymentMethodName.includes('crédito') || paymentMethodName.includes('credito') || paymentMethodName.includes('tarjeta')) {
        salesByPaymentType.credito += advance;
      } else if (paymentMethodName.includes('transferencia') || paymentMethodName.includes('depósito') || paymentMethodName.includes('deposito')) {
        salesByPaymentType.transferencia += advance;
      } else if (paymentMethodName.includes('intercambio')) {
        salesByPaymentType.intercambio += advance;
      } else {
        salesByPaymentType.efectivo += advance;
      }
    });

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
        finalBalance
      },
      salesByPaymentType,
      orders: orders.map(order => ({
        orderId: order._id,
        orderNumber: order.orderNumber,
        clientName: order.clientInfo?.name || 'N/A',
        recipientName: order.deliveryData?.recipientName || 'N/A',
        total: order.total,
        advance: order.advance,
        shippingType: order.shippingType,
        paymentMethod: order.paymentMethod?.name || 'N/A',
        status: order.status,
        saleDate: order.createdAt,
        itemsCount: order.items?.length || 0
      })),
      expenses: cashRegister.expenses.map(expense => ({
        expenseConcept: expense.expenseConcept,
        amount: expense.amount,
        expenseDate: expense.expenseDate
      }))
    });

    // Guardar el log
    await cashRegisterLog.save();

    // Actualizar caja registradora - cerrar y reiniciar datos
    cashRegister.isOpen = false;
    cashRegister.cashierId = null;
    cashRegister.currentBalance = 0;
    cashRegister.initialBalance = 0;
    cashRegister.lastRegistry = [];
    cashRegister.expenses = [];
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

export {
  getAllCashRegisters,
  getCashRegisterById,
  createCashRegister,
  updateCashRegister,
  toggleActiveCashRegister,
  toggleOpenCashRegister,
  deleteCashRegister,
  getCashiersAndManagersByAdmin,
  getUserCashRegister,
  registerExpense,
  getCashRegisterSummary,
  closeCashRegister
};
