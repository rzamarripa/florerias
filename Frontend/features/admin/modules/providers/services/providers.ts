import { apiCall } from "@/utils/api";
import { Provider, CreateProviderData, UpdateProviderData } from "../types";

export interface ProviderFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  company?: string;
}

export interface GetProvidersResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Provider[];
}

export const providersService = {
  getAllProviders: async (filters: ProviderFilters = {}): Promise<GetProvidersResponse> => {
    const { page = 1, limit = 10, search, isActive, company } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());
    if (company) searchParams.append('company', company);

    const response = await apiCall<GetProvidersResponse>(`/providers?${searchParams}`);
    return response;
  },

  getProviderById: async (providerId: string): Promise<{ success: boolean; data: Provider }> => {
    const response = await apiCall<{ success: boolean; data: Provider }>(`/providers/${providerId}`);
    return response;
  },

  createProvider: async (providerData: CreateProviderData): Promise<{ success: boolean; data: Provider; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Provider; message: string }>("/providers", {
      method: "POST",
      body: JSON.stringify(providerData),
    });
    return response;
  },

  updateProvider: async (
    providerId: string,
    providerData: UpdateProviderData
  ): Promise<{ success: boolean; data: Provider; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Provider; message: string }>(`/providers/${providerId}`, {
      method: "PUT",
      body: JSON.stringify(providerData),
    });
    return response;
  },

  activateProvider: async (providerId: string): Promise<{ success: boolean; data: Provider; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Provider; message: string }>(`/providers/${providerId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateProvider: async (providerId: string): Promise<{ success: boolean; data: Provider; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Provider; message: string }>(`/providers/${providerId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },

  deleteProvider: async (providerId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/providers/${providerId}`, {
      method: "DELETE",
    });
    return response;
  },
};
