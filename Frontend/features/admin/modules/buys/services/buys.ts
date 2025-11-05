import { apiCall } from "@/utils/api";
import {
  Buy,
  BuyFilters,
  CreateBuyData,
  GetBuysResponse,
  UpdateBuyData,
} from "../types";

export const buysService = {
  getAllBuys: async (filters: BuyFilters = {}): Promise<GetBuysResponse> => {
    const { page = 1, limit = 15, startDate, endDate, branchId, paymentMethodId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (branchId) searchParams.append('branchId', branchId);
    if (paymentMethodId) searchParams.append('paymentMethodId', paymentMethodId);

    const response = await apiCall<GetBuysResponse>(`/buys?${searchParams}`);
    return response;
  },

  getBuyById: async (buyId: string): Promise<{ success: boolean; data: Buy }> => {
    const response = await apiCall<{ success: boolean; data: Buy }>(`/buys/${buyId}`);
    return response;
  },

  createBuy: async (buyData: CreateBuyData): Promise<{ success: boolean; data: Buy; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Buy; message: string }>("/buys", {
      method: "POST",
      body: JSON.stringify(buyData),
    });
    return response;
  },

  updateBuy: async (
    buyId: string,
    buyData: UpdateBuyData
  ): Promise<{ success: boolean; data: Buy; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Buy; message: string }>(`/buys/${buyId}`, {
      method: "PUT",
      body: JSON.stringify(buyData),
    });
    return response;
  },

  deleteBuy: async (buyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/buys/${buyId}`, {
      method: "DELETE",
    });
    return response;
  },
};
