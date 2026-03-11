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
    const { page = 1, limit = 10, search, estatus } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());

    const response = await apiCall<Production[]>(`/production-users?${searchParams}`);
    return response as any;
  },

  getProductionById: async (productionId: string): Promise<{ success: boolean; data: Production }> => {
    const response = await apiCall<Production>(`/production-users/${productionId}`);
    return response as any;
  },

  createProduction: async (productionData: CreateProductionData): Promise<CreateProductionResponseData> => {
    const response = await apiCall<Production>("/production-users", {
      method: "POST",
      body: JSON.stringify(productionData),
    });
    return response as any;
  },

  updateProduction: async (
    productionId: string,
    productionData: UpdateProductionData
  ): Promise<CreateProductionResponseData> => {
    const response = await apiCall<Production>(`/production-users/${productionId}`, {
      method: "PUT",
      body: JSON.stringify(productionData),
    });
    return response as any;
  },

  deleteProduction: async (productionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<null>(`/production-users/${productionId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  activateProduction: async (productionId: string): Promise<CreateProductionResponseData> => {
    const response = await apiCall<Production>(`/production-users/${productionId}/activate`, {
      method: "PUT",
    });
    return response as any;
  },

  deactivateProduction: async (productionId: string): Promise<CreateProductionResponseData> => {
    const response = await apiCall<Production>(`/production-users/${productionId}/deactivate`, {
      method: "PUT",
    });
    return response as any;
  },
};
