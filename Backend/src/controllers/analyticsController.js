import Order from '../models/Order.js';
import OrderPayment from '../models/OrderPayment.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { Storage } from '../models/Storage.js';
import { ProductCategory } from '../models/ProductCategory.js';
import mongoose from 'mongoose';

// Obtener datos completos del dashboard analítico
export const getDashboardData = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      branchId,
      cashierId,
      categoryId,
      period = 'day'
    } = req.query;

    // Obtener el ID del usuario autenticado
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');
    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene rol asignado'
      });
    }

    const userRole = currentUser.role.name;

    // Determinar las sucursales a las que el usuario tiene acceso
    let branchIds = [];

    if (userRole === 'Administrador') {
      // Buscar sucursales donde el usuario es administrador
      const userBranches = await Branch.find({
        administrator: userId,
        isActive: true
      }).select('_id');
      branchIds = userBranches.map(branch => branch._id);
    } else if (userRole === 'Gerente') {
      // Buscar la sucursal donde el usuario es gerente
      const userBranch = await Branch.findOne({
        manager: userId,
        isActive: true
      }).select('_id');
      if (userBranch) {
        branchIds = [userBranch._id];
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a las estadísticas'
      });
    }

    // Si no hay sucursales, retornar datos vacíos
    if (branchIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: getEmptyDashboardData()
      });
    }

    // Si se proporciona un branchId específico, verificar que el usuario tenga acceso
    if (branchId) {
      const specificBranchId = new mongoose.Types.ObjectId(branchId);
      const hasAccess = branchIds.some(id => id.equals(specificBranchId));

      if (hasAccess) {
        branchIds = [specificBranchId];
      } else {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta sucursal'
        });
      }
    }

    // Construir filtros para las órdenes
    const orderFilters = {
      branchId: { $in: branchIds }
    };

    // Filtros de fecha
    if (startDate || endDate) {
      orderFilters.orderDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        orderFilters.orderDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        orderFilters.orderDate.$lte = end;
      }
    }

    // Filtro por cajero
    if (cashierId) {
      orderFilters.cashier = new mongoose.Types.ObjectId(cashierId);
    }

    console.log('Analytics - Filtros aplicados:', JSON.stringify(orderFilters, null, 2));

    // Obtener todas las órdenes que cumplen con los filtros
    const orders = await Order.find(orderFilters)
      .populate('cashier', 'profile.name profile.lastName profile.fullName')
      .populate({
        path: 'items.productId',
        select: 'nombre productCategory',
        populate: {
          path: 'productCategory',
          select: 'name'
        }
      })
      .populate('paymentMethod', 'name');

    console.log('Analytics - Órdenes encontradas:', orders.length);

    // CALCULAR RESUMEN PRINCIPAL
    const totalSales = orders.length;

    // Obtener todos los pagos de estas órdenes
    const orderIds = orders.map(order => order._id);
    const payments = await OrderPayment.find({
      orderId: { $in: orderIds }
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageTicket = totalSales > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / totalSales : 0;
    const totalProducts = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // Calcular cambio porcentual (comparar con período anterior)
    const percentageChange = await calculatePercentageChange(orderFilters, totalRevenue);

    // TENDENCIA DE VENTAS (últimos días según el período)
    const salesTrend = await calculateSalesTrend(orders, period);

    // COMPARACIÓN MENSUAL
    const monthlyComparison = await calculateMonthlyComparison(branchIds);

    // VENTAS POR CATEGORÍA
    const salesByCategory = await calculateSalesByCategory(orders);

    // VENTAS POR MÉTODO DE PAGO
    const salesByPaymentMethod = calculateSalesByPaymentMethod(orders, payments);

    // VENTAS POR HORA DEL DÍA
    const salesByHour = calculateSalesByHour(orders);

    // VENTAS POR DÍA DE LA SEMANA
    const salesByDayOfWeek = calculateSalesByDayOfWeek(orders);

    // TOP PRODUCTOS MÁS VENDIDOS
    const topProducts = calculateTopProducts(orders);

    // RANKING DE CAJEROS
    const cashierRanking = await calculateCashierRanking(orders, payments);

    // PRODUCTOS CON STOCK BAJO
    const lowStockProducts = await getLowStockProducts(branchIds);

    // Respuesta final
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalRevenue,
          averageTicket,
          totalProducts,
          percentageChange
        },
        salesTrend,
        monthlyComparison,
        salesByCategory,
        salesByPaymentMethod,
        salesByHour,
        salesByDayOfWeek,
        topProducts,
        cashierRanking,
        lowStockProducts
      }
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ==================== FUNCIONES AUXILIARES ====================

// Datos vacíos por defecto
function getEmptyDashboardData() {
  return {
    summary: {
      totalSales: 0,
      totalRevenue: 0,
      averageTicket: 0,
      totalProducts: 0,
      percentageChange: 0
    },
    salesTrend: [],
    monthlyComparison: {
      currentMonth: { sales: 0, revenue: 0 },
      previousMonth: { sales: 0, revenue: 0 },
      percentageChange: { sales: 0, revenue: 0 }
    },
    salesByCategory: [],
    salesByPaymentMethod: [],
    salesByHour: [],
    salesByDayOfWeek: [],
    topProducts: [],
    cashierRanking: [],
    lowStockProducts: []
  };
}

// Calcular cambio porcentual vs período anterior
async function calculatePercentageChange(currentFilters, currentRevenue) {
  try {
    if (!currentFilters.orderDate || !currentFilters.orderDate.$gte) {
      return 0;
    }

    const startDate = new Date(currentFilters.orderDate.$gte);
    const endDate = currentFilters.orderDate.$lte ? new Date(currentFilters.orderDate.$lte) : new Date();

    // Calcular duración del período
    const periodDuration = endDate - startDate;

    // Crear filtros para período anterior
    const previousStart = new Date(startDate.getTime() - periodDuration);
    const previousEnd = new Date(startDate.getTime());

    const previousFilters = {
      ...currentFilters,
      orderDate: {
        $gte: previousStart,
        $lte: previousEnd
      }
    };

    // Obtener órdenes del período anterior
    const previousOrders = await Order.find(previousFilters);
    const previousOrderIds = previousOrders.map(o => o._id);
    const previousPayments = await OrderPayment.find({
      orderId: { $in: previousOrderIds }
    });

    const previousRevenue = previousPayments.reduce((sum, p) => sum + p.amount, 0);

    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;

    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  } catch (error) {
    console.error('Error calculando cambio porcentual:', error);
    return 0;
  }
}

// Calcular tendencia de ventas
function calculateSalesTrend(orders, period = 'day') {
  const trendMap = new Map();

  orders.forEach(order => {
    const date = new Date(order.orderDate || order.createdAt);
    let key;

    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!trendMap.has(key)) {
      trendMap.set(key, { date: key, count: 0, amount: 0 });
    }

    const trend = trendMap.get(key);
    trend.count += 1;
    trend.amount += order.total;
  });

  return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Comparación mensual
async function calculateMonthlyComparison(branchIds) {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Mes actual
  const currentMonthOrders = await Order.find({
    branchId: { $in: branchIds },
    orderDate: { $gte: currentMonthStart, $lte: currentMonthEnd }
  });

  const currentOrderIds = currentMonthOrders.map(o => o._id);
  const currentPayments = await OrderPayment.find({ orderId: { $in: currentOrderIds } });

  const currentMonthSales = currentMonthOrders.length;
  const currentMonthRevenue = currentPayments.reduce((sum, p) => sum + p.amount, 0);

  // Mes anterior
  const previousMonthOrders = await Order.find({
    branchId: { $in: branchIds },
    orderDate: { $gte: previousMonthStart, $lte: previousMonthEnd }
  });

  const previousOrderIds = previousMonthOrders.map(o => o._id);
  const previousPayments = await OrderPayment.find({ orderId: { $in: previousOrderIds } });

  const previousMonthSales = previousMonthOrders.length;
  const previousMonthRevenue = previousPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calcular cambios porcentuales
  const salesChange = previousMonthSales === 0 ?
    (currentMonthSales > 0 ? 100 : 0) :
    ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;

  const revenueChange = previousMonthRevenue === 0 ?
    (currentMonthRevenue > 0 ? 100 : 0) :
    ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  return {
    currentMonth: {
      sales: currentMonthSales,
      revenue: currentMonthRevenue
    },
    previousMonth: {
      sales: previousMonthSales,
      revenue: previousMonthRevenue
    },
    percentageChange: {
      sales: salesChange,
      revenue: revenueChange
    }
  };
}

// Ventas por categoría
async function calculateSalesByCategory(orders) {
  // Obtener todas las categorías de productos activas
  const categories = await ProductCategory.find({ isActive: true });

  const categoryMap = new Map();
  let totalAmount = 0;

  // Inicializar el mapa con todas las categorías
  categories.forEach(category => {
    categoryMap.set(category._id.toString(), {
      name: category.name,
      total: 0
    });
  });

  // Agregar categoría "Sin categoría" para productos sin categoría asignada
  categoryMap.set('sin-categoria', {
    name: 'Sin categoría',
    total: 0
  });

  // Sumar las ventas por categoría
  orders.forEach(order => {
    order.items.forEach(item => {
      const amount = item.amount;
      totalAmount += amount;

      // Obtener la categoría del producto
      const productCategoryId = item.productId?.productCategory?._id?.toString() ||
                                item.productId?.productCategory?.toString();

      if (productCategoryId && categoryMap.has(productCategoryId)) {
        categoryMap.get(productCategoryId).total += amount;
      } else {
        // Si no tiene categoría, agregar a "Sin categoría"
        categoryMap.get('sin-categoria').total += amount;
      }
    });
  });

  // Convertir el mapa a array y calcular porcentajes
  const result = Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      category: data.name,
      total: data.total,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0
    }))
    .filter(item => item.total > 0) // Filtrar categorías sin ventas
    .sort((a, b) => b.total - a.total);

  return result;
}

// Ventas por método de pago
function calculateSalesByPaymentMethod(orders, payments) {
  const methodMap = new Map();

  payments.forEach(payment => {
    // Encontrar la orden correspondiente
    const order = orders.find(o => o._id.equals(payment.orderId));
    if (!order || !order.paymentMethod) return;

    const method = typeof order.paymentMethod === 'string' ?
      order.paymentMethod :
      order.paymentMethod.name;

    if (!methodMap.has(method)) {
      methodMap.set(method, { method, amount: 0, count: 0 });
    }

    const data = methodMap.get(method);
    data.amount += payment.amount;
    data.count += 1;
  });

  return Array.from(methodMap.values()).sort((a, b) => b.amount - a.amount);
}

// Ventas por hora del día
function calculateSalesByHour(orders) {
  const hourMap = new Map();

  // Inicializar todas las horas
  for (let i = 0; i < 24; i++) {
    const hourKey = `${String(i).padStart(2, '0')}:00`;
    hourMap.set(hourKey, { hour: hourKey, count: 0, amount: 0 });
  }

  orders.forEach(order => {
    const date = new Date(order.orderDate || order.createdAt);
    const hour = `${String(date.getHours()).padStart(2, '0')}:00`;

    const data = hourMap.get(hour);
    if (data) {
      data.count += 1;
      data.amount += order.total;
    }
  });

  return Array.from(hourMap.values()).filter(h => h.count > 0);
}

// Ventas por día de la semana
function calculateSalesByDayOfWeek(orders) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMap = new Map();

  // Inicializar todos los días
  dayNames.forEach(day => {
    dayMap.set(day, { day, count: 0, amount: 0 });
  });

  orders.forEach(order => {
    const date = new Date(order.orderDate || order.createdAt);
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex];

    const data = dayMap.get(dayName);
    data.count += 1;
    data.amount += order.total;
  });

  return Array.from(dayMap.values());
}

// Top productos más vendidos
function calculateTopProducts(orders) {
  const productMap = new Map();

  orders.forEach(order => {
    order.items.forEach(item => {
      const productId = item.productId?._id?.toString() || item.productName;
      const productName = item.productName;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          _id: productId,
          name: productName,
          quantity: 0,
          revenue: 0
        });
      }

      const product = productMap.get(productId);
      product.quantity += item.quantity;
      product.revenue += item.amount;
    });
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
}

// Ranking de cajeros
async function calculateCashierRanking(orders, payments) {
  const cashierMap = new Map();

  orders.forEach(order => {
    if (!order.cashier) return;

    const cashierId = order.cashier._id.toString();
    const cashierName = order.cashier.profile?.fullName ||
                       `${order.cashier.profile?.name || ''} ${order.cashier.profile?.lastName || ''}`.trim() ||
                       'Sin nombre';

    if (!cashierMap.has(cashierId)) {
      cashierMap.set(cashierId, {
        _id: cashierId,
        name: cashierName,
        salesCount: 0,
        totalRevenue: 0
      });
    }

    const cashier = cashierMap.get(cashierId);
    cashier.salesCount += 1;
  });

  // Agregar ingresos de pagos
  payments.forEach(payment => {
    const order = orders.find(o => o._id.equals(payment.orderId));
    if (!order || !order.cashier) return;

    const cashierId = order.cashier._id.toString();
    const cashier = cashierMap.get(cashierId);
    if (cashier) {
      cashier.totalRevenue += payment.amount;
    }
  });

  // Calcular ticket promedio
  const result = Array.from(cashierMap.values()).map(cashier => ({
    ...cashier,
    averageTicket: cashier.salesCount > 0 ? cashier.totalRevenue / cashier.salesCount : 0
  }));

  return result.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
}

// Productos con stock bajo
async function getLowStockProducts(branchIds) {
  try {
    const storages = await Storage.find({
      branch: { $in: branchIds }
    }).populate('products.productId', 'nombre minStock');

    const lowStockProducts = [];

    storages.forEach(storage => {
      storage.products.forEach(product => {
        if (!product.productId) return;

        const minStock = product.productId.minStock || 10;
        if (product.quantity <= minStock) {
          lowStockProducts.push({
            _id: product.productId._id.toString(),
            name: product.productId.nombre,
            currentStock: product.quantity,
            minStock: minStock,
            category: product.productId.categoria || 'Sin categoría'
          });
        }
      });
    });

    return lowStockProducts.sort((a, b) => a.currentStock - b.currentStock).slice(0, 10);
  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
    return [];
  }
}
