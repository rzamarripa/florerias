import { apiCall } from "@/utils/api";
import { CashRegisterLog, CashRegisterRef } from "../types";

export interface CashRegisterLogFilters {
  page?: number;
  limit?: number;
  cashRegisterId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetCashRegisterLogsResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: CashRegisterLog[];
}

export const cashRegisterLogsService = {
  getAllCashRegisterLogs: async (filters: CashRegisterLogFilters = {}): Promise<GetCashRegisterLogsResponse> => {
    const { page = 1, limit = 10, cashRegisterId, branchId, startDate, endDate } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (cashRegisterId) searchParams.append('cashRegisterId', cashRegisterId);
    if (branchId) searchParams.append('branchId', branchId);
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);

    const response = await apiCall<GetCashRegisterLogsResponse>(`/cash-register-logs?${searchParams}`);
    return response as any;
  },

  getCashRegisterLogById: async (logId: string): Promise<{ success: boolean; data: CashRegisterLog }> => {
    const response = await apiCall<{ success: boolean; data: CashRegisterLog }>(`/cash-register-logs/${logId}`);
    return response as any;
  },

  getUserCashRegisters: async (): Promise<{ success: boolean; data: CashRegisterRef[] }> => {
    const response = await apiCall<{ success: boolean; data: CashRegisterRef[] }>("/cash-register-logs/user/cash-registers");
    return response as any;
  },
};
