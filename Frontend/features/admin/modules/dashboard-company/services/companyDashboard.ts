import { apiCall, ApiResponse } from "@/utils/api";
import { BranchStats, DateFilters } from "../types";

export const companyDashboardService = {
  // Obtener estadísticas de todas las sucursales del administrador
  async getBranchesStats(filters: DateFilters): Promise<{
    success: boolean;
    data: BranchStats[];
  }> {
    try {
      const params = new URLSearchParams({
        isActive: "true",
        limit: "100",
      });

      const response = await apiCall<any[]>(`/branches?${params}`, {
        method: "GET",
      });

      if (!response.success) {
        throw new Error("Error al obtener sucursales");
      }

      const branches = response.data;

      // Para cada sucursal, obtener sus estadísticas
      const branchesWithStats = await Promise.all(
        branches.map(async (branch: any) => {
          const stats = await this.getBranchStats(branch._id, filters);
          return {
            ...branch,
            stats,
          };
        })
      );

      return {
        success: true,
        data: branchesWithStats,
      };
    } catch (error: any) {
      console.error("Error al obtener estadísticas de sucursales:", error);
      throw error;
    }
  },

  // Obtener estadísticas de una sucursal específica
  async getBranchStats(
    branchId: string,
    filters: DateFilters
  ): Promise<{
    totalExpenses: number;
    totalPurchases: number;
    totalSales: number;
    activeCashRegisters: number;
    completedOrders: number;
    totalOrders: number;
    completionPercentage: number;
  }> {
    try {
      // Peticiones paralelas para obtener todas las estadísticas
      const [expensesRes, purchasesRes, ordersRes, cashRegistersRes] =
        await Promise.all([
          // Gastos
          apiCall<any[]>(
            `/expenses?${new URLSearchParams({
              branchId,
              startDate: filters.startDate,
              endDate: filters.endDate,
              limit: "1000",
            })}`,
            { method: "GET" }
          ),
          // Compras
          apiCall<any[]>(
            `/buys?${new URLSearchParams({
              branchId,
              startDate: filters.startDate,
              endDate: filters.endDate,
              limit: "1000",
            })}`,
            { method: "GET" }
          ),
          // Órdenes (ventas)
          apiCall<any[]>(
            `/orders?${new URLSearchParams({
              branchId,
              startDate: filters.startDate,
              endDate: filters.endDate,
              limit: "1000",
            })}`,
            { method: "GET" }
          ),
          // Cajas activas
          apiCall<any[]>(
            `/cash-registers?${new URLSearchParams({
              branchId,
              isOpen: "true",
              isActive: "true",
            })}`,
            { method: "GET" }
          ),
        ]);

      // Calcular totales
      const expenses = expensesRes.data || [];
      const totalExpenses = expenses.reduce(
        (sum: number, exp: any) => sum + (exp.total || 0),
        0
      );

      const purchases = purchasesRes.data || [];
      const totalPurchases = purchases.reduce(
        (sum: number, purchase: any) => sum + (purchase.amount || 0),
        0
      );

      const orders = ordersRes.data || [];
      const totalSales = orders.reduce(
        (sum: number, order: any) => sum + (order.total || 0),
        0
      );

      const completedOrders = orders.filter(
        (order: any) => order.status === "completado"
      ).length;

      const totalOrders = orders.length;
      const completionPercentage =
        totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      const activeCashRegisters = cashRegistersRes.data?.length || 0;

      return {
        totalExpenses,
        totalPurchases,
        totalSales,
        activeCashRegisters,
        completedOrders,
        totalOrders,
        completionPercentage,
      };
    } catch (error) {
      console.error(
        `Error al obtener estadísticas de sucursal ${branchId}:`,
        error
      );
      return {
        totalExpenses: 0,
        totalPurchases: 0,
        totalSales: 0,
        activeCashRegisters: 0,
        completedOrders: 0,
        totalOrders: 0,
        completionPercentage: 0,
      };
    }
  },

  // Obtener empleados de una sucursal
  async getBranchEmployees(branchId: string) {
    try {
      const response = await apiCall<any>(`/branches/${branchId}`, {
        method: "GET",
      });
      return {
        success: true,
        data: response.data.employees || [],
      };
    } catch (error: any) {
      console.error("Error al obtener empleados:", error);
      throw error;
    }
  },

  // Obtener ventas de una sucursal
  async getBranchSales(branchId: string, filters: DateFilters) {
    try {
      const params = new URLSearchParams({
        branchId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: "100",
      });

      const response = await apiCall<any[]>(`/orders?${params}`, {
        method: "GET",
      });

      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error("Error al obtener ventas:", error);
      throw error;
    }
  },

  // Obtener gastos de una sucursal
  async getBranchExpenses(branchId: string, filters: DateFilters) {
    try {
      const params = new URLSearchParams({
        branchId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: "100",
      });

      const response = await apiCall<any[]>(`/expenses?${params}`, {
        method: "GET",
      });

      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error("Error al obtener gastos:", error);
      throw error;
    }
  },

  // Obtener compras de una sucursal
  async getBranchPurchases(branchId: string, filters: DateFilters) {
    try {
      const params = new URLSearchParams({
        branchId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: "100",
      });

      const response = await apiCall<any[]>(`/buys?${params}`, {
        method: "GET",
      });

      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error("Error al obtener compras:", error);
      throw error;
    }
  },
};

export default companyDashboardService;
