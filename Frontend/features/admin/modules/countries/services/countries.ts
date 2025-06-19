import { apiCall, ApiResponse } from "@/utils/api";
import { Country } from "../types";

export interface CreateCountryData {
  name: string;
}

export interface UpdateCountryData {
  name?: string;
}

export const countriesService = {
  getAll: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, search, isActive } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(isActive && { isActive }),
    });
    return await apiCall<ApiResponse<Country[]>>(`/countries?${searchParams}`);
  },

  create: async (data: CreateCountryData) => {
    return await apiCall<ApiResponse<Country>>("/countries", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
  },

  update: async (id: string, data: UpdateCountryData) => {
    return await apiCall<ApiResponse<Country>>(`/countries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
  },

  activate: async (id: string) => {
    return await apiCall<ApiResponse<null>>(`/countries/${id}/active`, {
      method: "PUT",
    });
  },

  delete: async (id: string) => {
    return await apiCall<ApiResponse<null>>(`/countries/${id}`, {
      method: "DELETE",
    });
  },

  toggleStatus: async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      return await countriesService.delete(id);
    } else {
      return await countriesService.activate(id);
    }
  },
};
