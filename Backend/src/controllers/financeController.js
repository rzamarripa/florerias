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
      orderDate: dateFilter,
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
    const { branchId, startDate, endDate, clientIds, paymentMethods, cashierId } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol y empresa
    const User = (await import('../models/User.js')).User;
    const Branch = (await import('../models/Branch.js')).Branch;
    const Company = (await import('../models/Company.js')).Company;
    const PaymentMethod = (await import('../models/PaymentMethod.js')).default;
    const OrderPayment = (await import('../models/OrderPayment.js')).default;

    const user = await User.findById(userId).populate('role');
    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene rol asignado'
      });
    }

    const userRole = user.role.name;
    let companyId = null;
    let branchIdsToSearch = [];

    // Determinar la empresa y sucursales según el rol
    if (branchId) {
      branchIdsToSearch = [branchId];
      // Obtener la empresa de la sucursal
      const branch = await Branch.findById(branchId);
      if (branch) {
        const company = await Company.findOne({ branches: branch._id });
        if (company) {
          companyId = company._id;
        }
      }
    } else {
      if (userRole === 'Administrador') {
        const company = await Company.findOne({ administrator: userId });
        if (!company) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró empresa asociada al administrador'
          });
        }
        companyId = company._id;

        const branches = await Branch.find({
          companyId: company._id,
          isActive: true
        }).select('_id');
        branchIdsToSearch = branches.map(b => b._id);
      } else if (userRole === 'Gerente') {
        const branch = await Branch.findOne({
          manager: userId,
          isActive: true
        });
        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al gerente'
          });
        }
        branchIdsToSearch = [branch._id];

        const company = await Company.findOne({ branches: branch._id });
        if (company) {
          companyId = company._id;
        }
      } else if (userRole === 'Cajero') {
        const branch = await Branch.findOne({
          employees: userId,
          isActive: true
        });
        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al cajero'
          });
        }
        branchIdsToSearch = [branch._id];

        const company = await Company.findOne({ branches: branch._id });
        if (company) {
          companyId = company._id;
        }
      }
    }

    if (branchIdsToSearch.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Obtener los métodos de pago de la empresa
    const companyPaymentMethods = await PaymentMethod.find({
      company: companyId,
      status: true
    }).select('_id name abbreviation');

    if (companyPaymentMethods.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Convertir branchIds a ObjectId
    const branchObjectIds = branchIdsToSearch.map(id =>
      typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
    );

    // Construir query para órdenes
    const orderQuery = {};
    if (branchObjectIds.length === 1) {
      orderQuery.branchId = branchObjectIds[0];
    } else {
      orderQuery.branchId = { $in: branchObjectIds };
    }

    // Filtrar por clientes si se especifica
    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      orderQuery['clientInfo.clientId'] = { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filtrar por cajero si se especifica
    if (cashierId) {
      orderQuery.cashier = new mongoose.Types.ObjectId(cashierId);
    }

    // Para usuarios con rol "Cajero", agregar filtros específicos
    if (userRole === 'Cajero') {
      orderQuery.cashier = userId;
      orderQuery.isSocialMediaOrder = false;
    }

    // Obtener las órdenes que coincidan
    const orders = await Order.find(orderQuery).select('_id');
    const orderIds = orders.map(order => order._id);

    if (orderIds.length === 0) {
      // Si no hay órdenes, retornar métodos de pago con total 0
      const stats = companyPaymentMethods.map(method => ({
        paymentMethodId: method._id,
        paymentMethodName: method.name,
        abbreviation: method.abbreviation,
        total: 0
      }));

      return res.status(200).json({
        success: true,
        data: stats
      });
    }

    // Construir query para pagos
    const paymentQuery = {
      orderId: { $in: orderIds }
    };

    // Filtrar por fechas
    if (startDate || endDate) {
      paymentQuery.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        paymentQuery.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        paymentQuery.date.$lte = end;
      }
    }

    // Filtrar por métodos de pago si se especifica
    if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      paymentQuery.paymentMethod = { $in: paymentMethods.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Obtener pagos agrupados por método de pago
    const paymentsByMethod = await OrderPayment.aggregate([
      { $match: paymentQuery },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Crear un mapa de totales por método de pago
    const totalsMap = {};
    paymentsByMethod.forEach(item => {
      totalsMap[item._id.toString()] = item.total;
    });

    // Crear array de estadísticas con todos los métodos de pago de la empresa
    const stats = companyPaymentMethods.map(method => ({
      paymentMethodId: method._id,
      paymentMethodName: method.name,
      abbreviation: method.abbreviation,
      total: totalsMap[method._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      data: stats
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
      orderDate: dateFilter,
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
      else if (userRole === 'Cajero') {
        // Para cajeros, buscar su sucursal donde está como empleado
        const branch = await Branch.findOne({
          employees: userId,
          isActive: true
        }).select('_id');

        if (!branch) {
          return res.status(404).json({
            success: false,
            message: 'No se encontró sucursal asociada al cajero'
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
      orderMatch.orderDate = dateFilter;
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

    // Para usuarios con rol "Cajero", agregar filtros específicos
    if (userRole === 'Cajero') {
      orderMatch.cashier = userId; // Solo órdenes creadas por el cajero
      orderMatch.isSocialMediaOrder = false; // Solo órdenes que NO son de redes sociales
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
