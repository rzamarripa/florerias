import mongoose from "mongoose";
import Order from "../models/Order.js";
import { Event } from "../models/Event.js";
import { Buy } from "../models/Buy.js";
import { Expense } from "../models/Expense.js";

/**
 * Obtiene las estadísticas financieras generales
 */
export const getFinanceStats = async (req, res) => {
  try {
    const { startDate, endDate, clientIds, paymentMethods } = req.query;

    // Construir filtro de fechas
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDateObj;
    }

    // Filtro de clientes (si se proporciona)
    let clientFilter = {};
    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      clientFilter = { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filtro de métodos de pago (si se proporciona)
    let paymentMethodFilter = {};
    if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      paymentMethodFilter = { $in: paymentMethods.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // 1. Total Florería - Suma de todas las ventas (Orders) filtradas por cliente
    const orderMatch = {
      createdAt: dateFilter,
    };

    if (Object.keys(clientFilter).length > 0) {
      orderMatch['clientInfo.clientId'] = clientFilter;
    }

    if (Object.keys(paymentMethodFilter).length > 0) {
      orderMatch.paymentMethod = paymentMethodFilter;
    }

    const ordersAggregation = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    const totalFloreria = ordersAggregation.length > 0 ? ordersAggregation[0].total : 0;

    // 2. Total Eventos - Suma de eventos (no se filtran por cliente)
    const eventMatch = {
      createdAt: dateFilter,
    };

    const eventsAggregation = await Event.aggregate([
      { $match: eventMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalEventos = eventsAggregation.length > 0 ? eventsAggregation[0].total : 0;

    // 3. Total Gastos - Suma de gastos (no se filtran por cliente)
    const expenseMatch = {
      createdAt: dateFilter,
    };

    const expensesAggregation = await Expense.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    const totalGastos = expensesAggregation.length > 0 ? expensesAggregation[0].total : 0;

    // 4. Total Compras - Suma de compras (no se filtran por cliente)
    const buyMatch = {
      createdAt: dateFilter,
    };

    const buysAggregation = await Buy.aggregate([
      { $match: buyMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalCompras = buysAggregation.length > 0 ? buysAggregation[0].total : 0;

    // 5. Utilidad = (Total Florería + Total Eventos) - (Total Gastos + Total Compras)
    const utilidad = (totalFloreria + totalEventos) - (totalGastos + totalCompras);

    res.status(200).json({
      success: true,
      data: {
        totalFloreria,
        totalEventos,
        totalGastos,
        totalCompras,
        utilidad,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas financieras:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas financieras",
      error: error.message,
    });
  }
};

/**
 * Obtiene las estadísticas de ingresos separadas por método de pago
 */
export const getIncomeStats = async (req, res) => {
  try {
    const { startDate, endDate, clientIds, paymentMethods } = req.query;

    // Construir filtro de fechas
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDateObj;
    }

    // Filtro de clientes (si se proporciona)
    let clientFilter = {};
    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      clientFilter = { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filtro de métodos de pago (si se proporciona)
    let paymentMethodFilter = {};
    if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      paymentMethodFilter = { $in: paymentMethods.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Construir match para órdenes
    const orderMatch = {
      createdAt: dateFilter,
    };

    if (Object.keys(clientFilter).length > 0) {
      orderMatch['clientInfo.clientId'] = clientFilter;
    }

    if (Object.keys(paymentMethodFilter).length > 0) {
      orderMatch.paymentMethod = paymentMethodFilter;
    }

    // Obtener órdenes agrupadas por método de pago
    const incomeByPaymentMethod = await Order.aggregate([
      { $match: orderMatch },
      {
        $lookup: {
          from: "paymentmethods",
          localField: "paymentMethod",
          foreignField: "_id",
          as: "paymentMethodInfo",
        },
      },
      { $unwind: "$paymentMethodInfo" },
      {
        $group: {
          _id: "$paymentMethodInfo.name",
          total: { $sum: "$total" },
        },
      },
    ]);

    // Crear objeto con los totales por método de pago
    const stats = {
      transferencia: 0,
      efectivo: 0,
      tarjeta: 0,
      deposito: 0,
    };

    // Mapear los resultados a las categorías
    incomeByPaymentMethod.forEach((item) => {
      const methodName = item._id.toLowerCase();

      if (methodName.includes("transferencia")) {
        stats.transferencia += item.total;
      } else if (methodName.includes("efectivo")) {
        stats.efectivo += item.total;
      } else if (methodName.includes("tarjeta")) {
        stats.tarjeta += item.total;
      } else if (methodName.includes("deposito") || methodName.includes("depósito")) {
        stats.deposito += item.total;
      } else if (methodName.includes("cheque")) {
        stats.deposito += item.total;
      }
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de ingresos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de ingresos",
      error: error.message,
    });
  }
};

/**
 * Obtiene el listado de cobros realizados (órdenes con avance > 0)
 */
export const getPayments = async (req, res) => {
  try {
    const { startDate, endDate, clientIds, paymentMethods } = req.query;

    // Construir filtro de fechas
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDateObj;
    }

    // Filtro de clientes (si se proporciona)
    let clientFilter = {};
    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      clientFilter = { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filtro de métodos de pago (si se proporciona)
    let paymentMethodFilter = {};
    if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      paymentMethodFilter = { $in: paymentMethods.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Construir match para órdenes
    const orderMatch = {
      createdAt: dateFilter,
      advance: { $gt: 0 }, // Solo órdenes con avance > 0
    };

    if (Object.keys(clientFilter).length > 0) {
      orderMatch['clientInfo.clientId'] = clientFilter;
    }

    if (Object.keys(paymentMethodFilter).length > 0) {
      orderMatch.paymentMethod = paymentMethodFilter;
    }

    // Obtener las órdenes con los datos poblados
    const payments = await Order.find(orderMatch)
      .populate("paymentMethod", "name")
      .populate("branchId", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Formatear los datos para la respuesta
    const formattedPayments = payments.map((payment) => ({
      _id: payment._id,
      folio: payment.orderNumber,
      paymentDate: payment.createdAt,
      paymentMethod: payment.paymentMethod?.name || "N/A",
      client: payment.clientInfo?.name || "Cliente Anónimo",
      user: "Sistema", // Por defecto, ya que Order no tiene campo user directo
      total: payment.advance, // El monto del avance/pago realizado
    }));

    res.status(200).json({
      success: true,
      data: formattedPayments,
    });
  } catch (error) {
    console.error("Error al obtener listado de cobros:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener listado de cobros",
      error: error.message,
    });
  }
};

/**
 * Obtiene el listado de ventas con descuento (órdenes con discount > 0)
 */
export const getDiscountedSales = async (req, res) => {
  try {
    const { branchId, startDate, endDate, clientIds, paymentMethods, cashierId } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const User = (await import('../models/User.js')).User;
    const Role = (await import('../models/Roles.js')).Role;
    const Branch = (await import('../models/Branch.js')).Branch;
    const Company = (await import('../models/Company.js')).Company;

    const user = await User.findById(userId).populate('role');
    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene rol asignado'
      });
    }

    const userRole = user.role.name;
    let branchIdsToSearch = [];

    // Si se especifica una sucursal específica, usarla
    if (branchId) {
      branchIdsToSearch = [branchId];
    }
    // Si no se especifica sucursal, obtener todas según el rol
    else {
      if (userRole === 'Administrador') {
        // Buscar la empresa donde el usuario es administrator
        const company = await Company.findOne({ administrator: userId });

        if (!company) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró empresa asociada al administrador'
          });
        }

        // Buscar todas las sucursales de esa empresa
        const branches = await Branch.find({
          companyId: company._id,
          isActive: true
        }).select('_id');

        branchIdsToSearch = branches.map(b => b._id);
      }
      else if (userRole === 'Gerente') {
        // Para gerentes, buscar su sucursal
        const branch = await Branch.findOne({
          manager: userId,
          isActive: true
        }).select('_id');

        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al gerente'
          });
        }

        branchIdsToSearch = [branch._id];
      }
      else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver ventas con descuento'
        });
      }
    }

    // Validar que tengamos sucursales para buscar
    if (branchIdsToSearch.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron sucursales',
        data: []
      });
    }

    // Convertir branchIdsToSearch a ObjectId explícitamente
    const branchObjectIds = branchIdsToSearch.map(id =>
      typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
    );

    // Construir filtro de fechas
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$gte.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDateObj;
    }

    // Construir match para órdenes
    const orderMatch = {
      branchId: branchObjectIds.length === 1 ? branchObjectIds[0] : { $in: branchObjectIds },
      discount: { $gt: 0 }, // Solo órdenes con descuento > 0
    };

    if (Object.keys(dateFilter).length > 0) {
      orderMatch.createdAt = dateFilter;
    }

    // Filtro de clientes (si se proporciona)
    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      orderMatch['clientInfo.clientId'] = { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filtro de métodos de pago (si se proporciona)
    if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      orderMatch.paymentMethod = { $in: paymentMethods.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filtro de cajero (si se proporciona)
    if (cashierId) {
      orderMatch.cashier = new mongoose.Types.ObjectId(cashierId);
    }

    console.log('DiscountedSales OrderMatch:', JSON.stringify(orderMatch, null, 2));
    console.log('BranchIds:', branchObjectIds.map(id => id.toString()));

    // Obtener las órdenes con descuento
    const discountedSales = await Order.find(orderMatch)
      .populate('paymentMethod', 'name')
      .populate('branchId', 'branchName')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${discountedSales.length} discounted sales for ${branchObjectIds.length} branches`);

    // Formatear los datos para la respuesta
    const formattedSales = discountedSales.map((sale) => ({
      _id: sale._id,
      orderNumber: sale.orderNumber,
      clientName: sale.clientInfo?.name || 'Cliente Anónimo',
      branchName: sale.branchId?.branchName || 'N/A',
      createdAt: sale.createdAt,
      paymentMethod: sale.paymentMethod?.name || 'N/A',
      subtotal: sale.subtotal,
      discount: sale.discount,
      discountType: sale.discountType,
      total: sale.total,
      status: sale.status,
    }));

    res.status(200).json({
      success: true,
      message: 'Ventas con descuento obtenidas exitosamente',
      data: formattedSales,
    });
  } catch (error) {
    console.error('Error al obtener ventas con descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas con descuento',
      error: error.message,
    });
  }
};

/**
 * Obtiene el listado de compras filtradas por sucursal
 */
export const getBuysByBranch = async (req, res) => {
  try {
    const { branchId, startDate, endDate, paymentMethods } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const User = (await import('../models/User.js')).User;
    const Role = (await import('../models/Roles.js')).Role;
    const Branch = (await import('../models/Branch.js')).Branch;
    const Company = (await import('../models/Company.js')).Company;

    const user = await User.findById(userId).populate('role');
    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene rol asignado'
      });
    }

    const userRole = user.role.name;
    let branchIdsToSearch = [];

    // Si se especifica una sucursal específica, usarla
    if (branchId) {
      branchIdsToSearch = [branchId];
    }
    // Si no se especifica sucursal, obtener todas según el rol
    else {
      if (userRole === 'Administrador') {
        // Buscar la empresa donde el usuario es administrator
        const company = await Company.findOne({ administrator: userId });

        if (!company) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró empresa asociada al administrador'
          });
        }

        // Buscar todas las sucursales de esa empresa
        const branches = await Branch.find({
          companyId: company._id,
          isActive: true
        }).select('_id');

        branchIdsToSearch = branches.map(b => b._id);
      }
      else if (userRole === 'Gerente') {
        // Para gerentes, buscar su sucursal
        const branch = await Branch.findOne({
          manager: userId,
          isActive: true
        }).select('_id');

        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al gerente'
          });
        }

        branchIdsToSearch = [branch._id];
      }
      else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver compras'
        });
      }
    }

    // Validar que tengamos sucursales para buscar
    if (branchIdsToSearch.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron sucursales',
        data: []
      });
    }

    // Construir filtro de fechas
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$gte.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDateObj;
    }

    // Construir match para compras
    const buyMatch = {
      branch: branchIdsToSearch.length === 1 ? branchIdsToSearch[0] : { $in: branchIdsToSearch },
    };

    if (Object.keys(dateFilter).length > 0) {
      buyMatch.paymentDate = dateFilter;
    }

    // Filtro de métodos de pago (si se proporciona)
    if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      buyMatch.paymentMethod = { $in: paymentMethods.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Obtener las compras
    const buys = await Buy.find(buyMatch)
      .populate('paymentMethod', 'name')
      .populate('branch', 'branchName')
      .populate('user', 'profile.name profile.lastName')
      .sort({ paymentDate: -1 })
      .lean();

    console.log(`Found ${buys.length} buys for ${branchIdsToSearch.length} branches`);

    // Formatear los datos para la respuesta
    const formattedBuys = buys.map((buy) => ({
      _id: buy._id,
      folio: buy.folio,
      concept: buy.concept,
      description: buy.description,
      amount: buy.amount,
      paymentMethod: buy.paymentMethod?.name || 'N/A',
      paymentDate: buy.paymentDate,
      branchName: buy.branch?.branchName || 'N/A',
      userName: buy.user ? `${buy.user.profile.name} ${buy.user.profile.lastName}` : 'N/A',
      createdAt: buy.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Compras obtenidas exitosamente',
      data: formattedBuys,
    });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener compras',
      error: error.message,
    });
  }
};

/**
 * Obtiene el listado de gastos filtrados por sucursal
 */
export const getExpensesByBranch = async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const User = (await import('../models/User.js')).User;
    const Role = (await import('../models/Roles.js')).Role;
    const Branch = (await import('../models/Branch.js')).Branch;
    const Company = (await import('../models/Company.js')).Company;

    const user = await User.findById(userId).populate('role');
    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene rol asignado'
      });
    }

    const userRole = user.role.name;
    let branchIdsToSearch = [];

    // Si se especifica una sucursal específica, usarla
    if (branchId) {
      branchIdsToSearch = [branchId];
    }
    // Si no se especifica sucursal, obtener todas según el rol
    else {
      if (userRole === 'Administrador') {
        // Buscar la empresa donde el usuario es administrator
        const company = await Company.findOne({ administrator: userId });

        if (!company) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró empresa asociada al administrador'
          });
        }

        // Buscar todas las sucursales de esa empresa
        const branches = await Branch.find({
          companyId: company._id,
          isActive: true
        }).select('_id');

        branchIdsToSearch = branches.map(b => b._id);
      }
      else if (userRole === 'Gerente') {
        // Para gerentes, buscar su sucursal
        const branch = await Branch.findOne({
          manager: userId,
          isActive: true
        }).select('_id');

        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al gerente'
          });
        }

        branchIdsToSearch = [branch._id];
      }
      else {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver gastos'
        });
      }
    }

    // Validar que tengamos sucursales para buscar
    if (branchIdsToSearch.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron sucursales',
        data: []
      });
    }

    // Construir filtro de fechas
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$gte.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDateObj;
    }

    // Construir match para gastos
    const expenseMatch = {
      branch: branchIdsToSearch.length === 1 ? branchIdsToSearch[0] : { $in: branchIdsToSearch },
    };

    if (Object.keys(dateFilter).length > 0) {
      expenseMatch.paymentDate = dateFilter;
    }

    // Obtener los gastos
    const expenses = await Expense.find(expenseMatch)
      .populate('branch', 'branchName')
      .populate('user', 'profile.name profile.lastName')
      .sort({ paymentDate: -1 })
      .lean();

    console.log(`Found ${expenses.length} expenses for ${branchIdsToSearch.length} branches`);

    // Formatear los datos para la respuesta
    const formattedExpenses = expenses.map((expense) => ({
      _id: expense._id,
      folio: expense.folio,
      concept: expense.concept,
      total: expense.total,
      expenseType: expense.expenseType,
      paymentDate: expense.paymentDate,
      branchName: expense.branch?.branchName || 'N/A',
      userName: expense.user ? `${expense.user.profile.name} ${expense.user.profile.lastName}` : 'N/A',
      createdAt: expense.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Gastos obtenidos exitosamente',
      data: formattedExpenses,
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener gastos',
      error: error.message,
    });
  }
};
