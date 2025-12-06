import { apiCall } from "@/utils/api";
import {
  Order,
  OrderFilters,
  GetOrdersResponse,
  DashboardMetrics,
  MaterialUsageMetrics,
  Material,
  InsumoDetail,
} from "../types";

export const dashboardItemsService = {
  /**
   * Obtiene todas las órdenes con filtros
   */
  getOrders: async (filters: OrderFilters = {}): Promise<GetOrdersResponse> => {
    const { page = 1, limit = 1000, branchId, startDate, endDate, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (branchId) searchParams.append("branchId", branchId);
    if (startDate) searchParams.append("startDate", startDate);
    if (endDate) searchParams.append("endDate", endDate);
    if (status) searchParams.append("status", status);

    const response = await apiCall<GetOrdersResponse>(`/orders?${searchParams}`);
    return response;
  },

  /**
   * Obtiene todos los materiales
   */
  getAllMaterials: async (): Promise<Material[]> => {
    try {
      const response = await apiCall<{ success: boolean; data: Material[] }>(
        "/materials?limit=1000"
      );
      if (response && 'data' in response) {
        return response.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching materials:", error);
      return [];
    }
  },

  /**
   * Calcula las métricas del dashboard basadas en las órdenes del mes actual
   */
  calculateDashboardMetrics: async (orders: Order[]): Promise<DashboardMetrics> => {
    // Obtener todos los materiales para buscar precios
    const allMaterials = await dashboardItemsService.getAllMaterials();

    // Crear mapa de materiales por nombre para búsqueda rápida
    const materialsByName = new Map<string, Material>();
    allMaterials.forEach(material => {
      materialsByName.set(material.name.toLowerCase().trim(), material);
    });

    // Total de órdenes
    const totalOrders = orders.length;

    // Total de productos (suma de todos los items)
    const totalProducts = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // Total Revenue: Suma de importeVenta de insumos con isExtra = true
    let totalRevenue = 0;

    // Total Expenses: Suma de importeVenta de insumos con isExtra = false
    let totalExpenses = 0;

    // Net Profit: Suma de price de materiales con isExtra = true
    let netProfit = 0;

    // Cash Flow: Suma de price de materiales con isExtra = false
    let cashFlow = 0;

    // Procesar cada orden
    orders.forEach((order) => {
      // Procesar items de la orden
      order.items.forEach((item) => {
        item.insumos?.forEach((insumo) => {
          const insumoTotal = insumo.importeVenta * insumo.cantidad;

          if (insumo.isExtra === true) {
            // Revenue: suma importeVenta de extras
            totalRevenue += insumoTotal;

            // Net Profit: buscar price del material en la colección
            const material = materialsByName.get(insumo.nombre.toLowerCase().trim());
            if (material) {
              netProfit += material.price * insumo.cantidad;
            }
          } else {
            // Expenses: suma importeVenta de no extras
            totalExpenses += insumoTotal;

            // Cash Flow: buscar price del material en la colección
            const material = materialsByName.get(insumo.nombre.toLowerCase().trim());
            if (material) {
              cashFlow += material.price * insumo.cantidad;
            }
          }
        });
      });

      // Procesar materiales directos de la orden
      order.materials?.forEach((material) => {
        const materialTotal = material.importeVenta * material.cantidad;

        if (material.isExtra === true) {
          totalRevenue += materialTotal;

          const mat = materialsByName.get(material.nombre.toLowerCase().trim());
          if (mat) {
            netProfit += mat.price * material.cantidad;
          }
        } else {
          totalExpenses += materialTotal;

          const mat = materialsByName.get(material.nombre.toLowerCase().trim());
          if (mat) {
            cashFlow += mat.price * material.cantidad;
          }
        }
      });
    });

    // Calcular cambios porcentuales (simulados por ahora)
    const totalOrdersChange = "+8.2%";
    const totalProductsChange = "+5.5%";
    const totalProfitStatus = "stable";
    const cashFlowChange = "+5.5%";

    // Reportes trimestrales (ahora es async)
    const quarterlyReports = await dashboardItemsService.calculateQuarterlyReports(orders);

    // Órdenes a lo largo del tiempo (últimos 7 meses)
    const ordersOverTime = dashboardItemsService.calculateOrdersOverTime(orders);

    // Ganancias a lo largo del tiempo
    const profitOverTime = dashboardItemsService.calculateProfitOverTime(orders, totalRevenue);

    return {
      totalOrders,
      totalProducts,
      totalRevenue,
      totalExpenses,
      netProfit,
      cashFlow,
      totalProfit: totalRevenue, // Para compatibilidad con gráficos
      totalOrdersChange,
      totalProductsChange,
      totalProfitStatus,
      cashFlowChange,
      quarterlyReports,
      ordersOverTime,
      profitOverTime,
    };
  },

  /**
   * Calcula reportes semanales del mes actual
   */
  calculateQuarterlyReports: async (orders: Order[]) => {
    // Obtener todos los materiales para buscar precios
    const allMaterials = await dashboardItemsService.getAllMaterials();

    // Crear mapa de materiales por nombre para búsqueda rápida
    const materialsByName = new Map<string, Material>();
    allMaterials.forEach(material => {
      materialsByName.set(material.name.toLowerCase().trim(), material);
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Obtener el primer y último día del mes actual
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Calcular las semanas del mes
    const weeks: Array<{
      quarter: string;
      period: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    let weekNumber = 1;
    let currentDate = new Date(firstDayOfMonth);

    while (currentDate <= lastDayOfMonth) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Si la semana termina después del último día del mes, ajustar
      if (weekEnd > lastDayOfMonth) {
        weekEnd.setTime(lastDayOfMonth.getTime());
      }

      const formatDate = (date: Date) => {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      };

      weeks.push({
        quarter: `Semana ${weekNumber}`,
        period: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
        startDate: weekStart,
        endDate: weekEnd,
      });

      // Mover al siguiente día después del fin de la semana
      currentDate.setDate(weekEnd.getDate() + 1);
      weekNumber++;
    }

    return weeks.map((week) => {
      const weekOrders = orders.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= week.startDate && orderDate <= week.endDate;
      });

      // Revenue: Suma de importeVenta de insumos con isExtra = true
      let revenue = 0;

      // Expense: Suma de price (costo) de materiales con isExtra = true
      let expense = 0;

      weekOrders
        .filter((o) => o.status !== "cancelado")
        .forEach((order) => {
          // Procesar insumos de items
          order.items.forEach((item) => {
            item.insumos?.forEach((insumo) => {
              if (insumo.isExtra === true) {
                // Revenue: suma importeVenta de extras
                revenue += insumo.importeVenta * insumo.cantidad;

                // Expense: buscar price del material en la colección
                const material = materialsByName.get(insumo.nombre.toLowerCase().trim());
                if (material) {
                  expense += material.price * insumo.cantidad;
                }
              }
            });
          });

          // Procesar materiales directos de la orden
          order.materials?.forEach((material) => {
            if (material.isExtra === true) {
              // Revenue: suma importeVenta de extras
              revenue += material.importeVenta * material.cantidad;

              // Expense: buscar price del material en la colección
              const mat = materialsByName.get(material.nombre.toLowerCase().trim());
              if (mat) {
                expense += mat.price * material.cantidad;
              }
            }
          });
        });

      const margin = revenue - expense;

      return {
        quarter: week.quarter,
        period: week.period,
        revenue,
        expense,
        margin,
      };
    });
  },

  /**
   * Calcula órdenes a lo largo del tiempo (últimos 7 períodos)
   */
  calculateOrdersOverTime: (orders: Order[]) => {
    const periods = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7"];
    const now = new Date();
    const currentMonth = now.getMonth();

    return periods.map((period, index) => {
      const targetMonth = currentMonth - (6 - index);
      const targetDate = new Date(now.getFullYear(), targetMonth, 1);

      const count = orders.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return (
          orderDate.getMonth() === targetDate.getMonth() &&
          orderDate.getFullYear() === targetDate.getFullYear()
        );
      }).length;

      return { period, count };
    });
  },

  /**
   * Calcula ganancias a lo largo del tiempo
   */
  calculateProfitOverTime: (orders: Order[], totalRevenue: number) => {
    // Agrupar por fecha
    const profitByDate: Record<string, number> = {};

    orders
      .filter((order) => order.status !== "cancelado")
      .forEach((order) => {
        const date = new Date(order.orderDate).toISOString().split("T")[0];
        profitByDate[date] = (profitByDate[date] || 0) + order.total;
      });

    // Convertir a array y ordenar por fecha
    return Object.entries(profitByDate)
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Últimos 30 días
  },

  /**
   * Filtra órdenes del mes actual
   */
  filterCurrentMonthOrders: (orders: Order[]): Order[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });
  },

  /**
   * Extrae todos los materiales (insumos) de las órdenes
   */
  extractMaterialsFromOrders: (orders: Order[]): MaterialUsageMetrics => {
    const materialsMap: Record<
      string,
      { quantity: number; totalCost: number }
    > = {};
    let totalMaterialsUsed = 0;
    let totalMaterialsCost = 0;

    orders.forEach((order) => {
      // Procesar materials del order
      order.materials?.forEach((material) => {
        if (!materialsMap[material.nombre]) {
          materialsMap[material.nombre] = { quantity: 0, totalCost: 0 };
        }
        materialsMap[material.nombre].quantity += material.cantidad;
        materialsMap[material.nombre].totalCost +=
          material.importeVenta * material.cantidad;
        totalMaterialsUsed += material.cantidad;
        totalMaterialsCost += material.importeVenta * material.cantidad;
      });

      // Procesar insumos de cada item
      order.items.forEach((item) => {
        item.insumos?.forEach((insumo) => {
          if (!materialsMap[insumo.nombre]) {
            materialsMap[insumo.nombre] = { quantity: 0, totalCost: 0 };
          }
          materialsMap[insumo.nombre].quantity += insumo.cantidad;
          materialsMap[insumo.nombre].totalCost +=
            insumo.importeVenta * insumo.cantidad;
          totalMaterialsUsed += insumo.cantidad;
          totalMaterialsCost += insumo.importeVenta * insumo.cantidad;
        });
      });
    });

    // Obtener los materiales más usados
    const mostUsedMaterials = Object.entries(materialsMap)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        totalCost: data.totalCost,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const materialsPerOrder =
      orders.length > 0 ? totalMaterialsUsed / orders.length : 0;

    return {
      totalMaterialsUsed,
      totalMaterialsCost,
      mostUsedMaterials,
      materialsPerOrder,
    };
  },

  /**
   * Extrae detalles de insumos por orden con stock restante
   */
  extractInsumoDetails: async (orders: Order[], branchId: string): Promise<InsumoDetail[]> => {
    const details: InsumoDetail[] = [];

    // Obtener todos los materiales para buscar stock
    const allMaterials = await dashboardItemsService.getAllMaterials();
    const materialsByName = new Map<string, Material>();
    allMaterials.forEach(material => {
      materialsByName.set(material.name.toLowerCase().trim(), material);
    });

    // Obtener stock de la sucursal
    let branchStock: Record<string, number> = {};
    try {
      // Primero obtenemos el storage de la sucursal
      const storageResponse = await apiCall<{
        success: boolean;
        data: Array<{
          _id: string;
          branch: string;
          materials: Array<{
            materialId: { _id: string; name: string } | string;
            quantity: number;
          }>;
        }>;
      }>(`/storages?branch=${branchId}&limit=1`);

      if (storageResponse && 'data' in storageResponse && Array.isArray(storageResponse.data) && storageResponse.data.length > 0) {
        const storage = storageResponse.data[0];

        // Procesar los materiales del storage
        if (storage.materials && Array.isArray(storage.materials)) {
          storage.materials.forEach((material) => {
            // El materialId puede ser un objeto o un string (populated o no)
            const materialName = typeof material.materialId === 'object' && material.materialId !== null
              ? material.materialId.name
              : null;

            if (materialName) {
              branchStock[materialName.toLowerCase().trim()] = material.quantity;
            }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching branch stock:", error);
      // Continuar sin datos de stock en caso de error
    }

    // Procesar cada orden
    orders.forEach((order) => {
      // Procesar insumos de items
      order.items.forEach((item) => {
        item.insumos?.forEach((insumo) => {
          const stockRemaining = branchStock[insumo.nombre.toLowerCase().trim()] || 0;
          const totalVenta = insumo.importeVenta * insumo.cantidad;

          details.push({
            orderId: order._id,
            orderNumber: order.orderNumber || order._id,
            insumoName: insumo.nombre,
            stockUsed: insumo.cantidad,
            stockRemaining,
            isExtra: insumo.isExtra,
            totalVenta,
          });
        });
      });

      // Procesar materiales directos de la orden
      order.materials?.forEach((material) => {
        const stockRemaining = branchStock[material.nombre.toLowerCase().trim()] || 0;
        const totalVenta = material.importeVenta * material.cantidad;

        details.push({
          orderId: order._id,
          orderNumber: order.orderNumber || order._id,
          insumoName: material.nombre,
          stockUsed: material.cantidad,
          stockRemaining,
          isExtra: material.isExtra,
          totalVenta,
        });
      });
    });

    return details;
  },
};
