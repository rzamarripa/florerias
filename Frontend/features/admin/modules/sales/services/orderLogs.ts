import { apiCall, ApiResponse } from "@/utils/api";
import { OrderLog, OrderLogFilters } from "../types/orderLog";

export const orderLogsService = {
  /**
   * Obtiene todos los logs de una orden específica
   */
  getOrderLogs: async (
    orderId: string,
    filters?: OrderLogFilters
  ): Promise<ApiResponse<OrderLog[]>> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.eventType) params.append("eventType", filters.eventType);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const queryString = params.toString();
    const url = `/order-logs/${orderId}${queryString ? `?${queryString}` : ""}`;

    return await apiCall<OrderLog[]>(url, {
      method: "GET",
    });
  },

  /**
   * Obtiene un log específico por ID
   */
  getOrderLogById: async (logId: string): Promise<ApiResponse<OrderLog>> => {
    return await apiCall<OrderLog>(`/order-logs/log/${logId}`, {
      method: "GET",
    });
  },
};
