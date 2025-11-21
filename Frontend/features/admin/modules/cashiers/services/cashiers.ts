import { apiCall } from "@/utils/api";
import {
  Cashier,
  CashierFilters,
  CreateCashierData,
  CreateCashierResponseData,
  GetCashiersResponse,
  UpdateCashierData,
} from "../types";

export const cashiersService = {
  getAllCashiers: async (filters: CashierFilters = {}): Promise<GetCashiersResponse> => {
    const { page = 1, limit = 10, search, estatus, branchId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<Cashier[]>(`/cashiers?${searchParams}`);
    return response as any;
  },

  getCashierById: async (cashierId: string): Promise<{ success: boolean; data: Cashier }> => {
    const response = await apiCall<Cashier>(`/cashiers/${cashierId}`);
    return response as any;
  },

  createCashier: async (cashierData: CreateCashierData): Promise<CreateCashierResponseData> => {
    const response = await apiCall<Cashier>("/cashiers", {
      method: "POST",
      body: JSON.stringify(cashierData),
    });
    return response as any;
  },

  updateCashier: async (
    cashierId: string,
    cashierData: UpdateCashierData
  ): Promise<CreateCashierResponseData> => {
    const response = await apiCall<Cashier>(`/cashiers/${cashierId}`, {
      method: "PUT",
      body: JSON.stringify(cashierData),
    });
    return response as any;
  },

  deleteCashier: async (cashierId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<null>(`/cashiers/${cashierId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  activateCashier: async (cashierId: string): Promise<CreateCashierResponseData> => {
    const response = await apiCall<Cashier>(`/cashiers/${cashierId}/activate`, {
      method: "PUT",
    });
    return response as any;
  },

  deactivateCashier: async (cashierId: string): Promise<CreateCashierResponseData> => {
    const response = await apiCall<Cashier>(`/cashiers/${cashierId}/deactivate`, {
      method: "PUT",
    });
    return response as any;
  },
};