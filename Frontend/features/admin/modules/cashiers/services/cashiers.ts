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
    const { page = 1, limit = 10, nombre, apellidoPaterno, usuario, correo, telefono, cajero, estatus } = filters;
    
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (nombre) searchParams.append('nombre', nombre);
    if (apellidoPaterno) searchParams.append('apellidoPaterno', apellidoPaterno);
    if (usuario) searchParams.append('usuario', usuario);
    if (correo) searchParams.append('correo', correo);
    if (telefono) searchParams.append('telefono', telefono);
    if (cajero !== undefined) searchParams.append('cajero', cajero.toString());
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());

    const response = await apiCall<GetCashiersResponse>(`/cashiers?${searchParams}`);
    return response;
  },

  getCashierById: async (cashierId: string): Promise<{ success: boolean; data: Cashier }> => {
    const response = await apiCall<{ success: boolean; data: Cashier }>(`/cashiers/${cashierId}`);
    return response;
  },

  createCashier: async (cashierData: CreateCashierData): Promise<CreateCashierResponseData> => {
    const response = await apiCall<CreateCashierResponseData>("/cashiers", {
      method: "POST",
      body: JSON.stringify(cashierData),
    });
    return response;
  },

  updateCashier: async (
    cashierId: string,
    cashierData: UpdateCashierData
  ): Promise<CreateCashierResponseData> => {
    const response = await apiCall<CreateCashierResponseData>(`/cashiers/${cashierId}`, {
      method: "PUT",
      body: JSON.stringify(cashierData),
    });
    return response;
  },

  deleteCashier: async (cashierId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/cashiers/${cashierId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateCashier: async (cashierId: string): Promise<CreateCashierResponseData> => {
    const response = await apiCall<CreateCashierResponseData>(`/cashiers/${cashierId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateCashier: async (cashierId: string): Promise<CreateCashierResponseData> => {
    const response = await apiCall<CreateCashierResponseData>(`/cashiers/${cashierId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },
};