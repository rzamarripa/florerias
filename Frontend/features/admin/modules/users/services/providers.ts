import { apiCall } from "@/utils/api";
import { Provider } from "../types";

export const providersService = {
  getAll: async (
    params: {
      page?: number;
      limit?: number;
      name?: string;
      search?: string;
      isActive?: boolean;
    } = {}
  ) => {
    try {
      const { page = 1, limit = 10, name, search, isActive } = params;
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(name && { name }),
        ...(search && { search }),
        ...(isActive !== undefined && { isActive: isActive.toString() }),
      });
      const response = await apiCall<Provider[]>(`/providers?${searchParams}`);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiCall<Provider>(`/providers/${id}`);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
};
