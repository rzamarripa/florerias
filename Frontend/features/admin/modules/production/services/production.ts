import { apiCall } from "@/utils/api";
import {
  Production,
  ProductionFilters,
  CreateProductionData,
  CreateProductionResponseData,
  GetProductionResponse,
  UpdateProductionData,
} from "../types";

export const productionService = {
  getAllProduction: async (filters: ProductionFilters = {}): Promise<GetProductionResponse> => {
    const { page = 1, limit = 10, nombre, apellidoPaterno, usuario, correo, telefono, estatus } = filters;
    
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (nombre) searchParams.append('nombre', nombre);
    if (apellidoPaterno) searchParams.append('apellidoPaterno', apellidoPaterno);
    if (usuario) searchParams.append('usuario', usuario);
    if (correo) searchParams.append('correo', correo);
    if (telefono) searchParams.append('telefono', telefono);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());

    const response = await apiCall<GetProductionResponse>(`/production?${searchParams}`);
    return response;
  },

  getProductionById: async (productionId: string): Promise<{ success: boolean; data: Production }> => {
    const response = await apiCall<{ success: boolean; data: Production }>(`/production/${productionId}`);
    return response;
  },

  createProduction: async (productionData: CreateProductionData): Promise<CreateProductionResponseData> => {
    const response = await apiCall<CreateProductionResponseData>("/production", {
      method: "POST",
      body: JSON.stringify(productionData),
    });
    return response;
  },

  updateProduction: async (
    productionId: string,
    productionData: UpdateProductionData
  ): Promise<CreateProductionResponseData> => {
    const response = await apiCall<CreateProductionResponseData>(`/production/${productionId}`, {
      method: "PUT",
      body: JSON.stringify(productionData),
    });
    return response;
  },

  deleteProduction: async (productionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/production/${productionId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateProduction: async (productionId: string): Promise<CreateProductionResponseData> => {
    const response = await apiCall<CreateProductionResponseData>(`/production/${productionId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateProduction: async (productionId: string): Promise<CreateProductionResponseData> => {
    const response = await apiCall<CreateProductionResponseData>(`/production/${productionId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },
};