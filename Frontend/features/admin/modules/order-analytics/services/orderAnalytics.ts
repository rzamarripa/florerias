import { apiCall } from "@/utils/api";
import {
  AnalyticsFilters,
  AnalyticsResponse,
  ExportFilters,
} from "../types";

export const orderAnalyticsService = {
  /**
   * Get comprehensive analytics dashboard data
   */
  getDashboardData: async (
    filters: AnalyticsFilters = {}
  ): Promise<AnalyticsResponse> => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);
    if (filters.cashierId) searchParams.append("cashierId", filters.cashierId);
    if (filters.categoryId)
      searchParams.append("categoryId", filters.categoryId);
    if (filters.period) searchParams.append("period", filters.period);

    const response = await apiCall<AnalyticsResponse>(
      `/analytics/dashboard?${searchParams}`
    );
    return response as any;
  },

  /**
   * Get sales trend data for charts
   */
  getSalesTrend: async (filters: AnalyticsFilters = {}) => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);
    if (filters.period) searchParams.append("period", filters.period);

    const response = await apiCall(`/analytics/sales-trend?${searchParams}`);
    return response as any;
  },

  /**
   * Get top products by quantity or revenue
   */
  getTopProducts: async (
    filters: AnalyticsFilters & { limit?: number; sortBy?: "quantity" | "revenue" } = {}
  ) => {
    const { limit = 10, sortBy = "quantity", ...baseFilters } = filters;
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
      sortBy,
    });

    if (baseFilters.startDate)
      searchParams.append("startDate", baseFilters.startDate);
    if (baseFilters.endDate)
      searchParams.append("endDate", baseFilters.endDate);
    if (baseFilters.branchId)
      searchParams.append("branchId", baseFilters.branchId);

    const response = await apiCall(`/analytics/top-products?${searchParams}`);
    return response as any;
  },

  /**
   * Get cashier performance ranking
   */
  getCashierRanking: async (filters: AnalyticsFilters = {}) => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);

    const response = await apiCall(
      `/analytics/cashier-ranking?${searchParams}`
    );
    return response as any;
  },

  /**
   * Get sales by category breakdown
   */
  getSalesByCategory: async (filters: AnalyticsFilters = {}) => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);

    const response = await apiCall(
      `/analytics/sales-by-category?${searchParams}`
    );
    return response as any;
  },

  /**
   * Get sales by payment method
   */
  getSalesByPaymentMethod: async (filters: AnalyticsFilters = {}) => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);

    const response = await apiCall(
      `/analytics/sales-by-payment?${searchParams}`
    );
    return response as any;
  },

  /**
   * Get sales by hour of day
   */
  getSalesByHour: async (filters: AnalyticsFilters = {}) => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);

    const response = await apiCall(`/analytics/sales-by-hour?${searchParams}`);
    return response as any;
  },

  /**
   * Get sales by day of week
   */
  getSalesByDayOfWeek: async (filters: AnalyticsFilters = {}) => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);

    const response = await apiCall(
      `/analytics/sales-by-day-of-week?${searchParams}`
    );
    return response as any;
  },

  /**
   * Get low stock products
   */
  getLowStockProducts: async (branchId?: string) => {
    const searchParams = new URLSearchParams();
    if (branchId) searchParams.append("branchId", branchId);

    const response = await apiCall(
      `/analytics/low-stock?${searchParams}`
    );
    return response as any;
  },

  /**
   * Export analytics report
   */
  exportReport: async (filters: ExportFilters) => {
    const searchParams = new URLSearchParams();

    if (filters.startDate) searchParams.append("startDate", filters.startDate);
    if (filters.endDate) searchParams.append("endDate", filters.endDate);
    if (filters.branchId) searchParams.append("branchId", filters.branchId);
    if (filters.cashierId) searchParams.append("cashierId", filters.cashierId);
    if (filters.categoryId)
      searchParams.append("categoryId", filters.categoryId);
    if (filters.format) searchParams.append("format", filters.format);
    if (filters.includeCharts)
      searchParams.append("includeCharts", filters.includeCharts.toString());

    const response = await apiCall(
      `/analytics/export?${searchParams}`,
      { method: "GET" }
    );
    return response as any;
  },
};
