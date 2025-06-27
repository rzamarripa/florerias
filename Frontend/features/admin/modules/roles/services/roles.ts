import { apiCall, ApiResponse } from "@/utils/api";
import { Page, Role } from "../types";

export const rolesService = {
  getAll: async (): Promise<ApiResponse<Role[]>> => {
    return await apiCall<Role[]>("/roles");
  },

  getById: async (id: string): Promise<ApiResponse<Role>> => {
    return await apiCall<Role>(`/roles/${id}`);
  },

  create: async (data: Partial<Role>): Promise<ApiResponse<Role>> => {
    return await apiCall<Role>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  createRole: async (data: Partial<Role>): Promise<ApiResponse<Role>> => {
    return await apiCall<Role>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<Role>
  ): Promise<ApiResponse<Role>> => {
    return await apiCall<Role>(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await apiCall<void>(`/roles/${id}`, {
      method: "DELETE",
    });
  },

  getPages: async (): Promise<ApiResponse<Page[]>> => {
    return await apiCall<Page[]>("/pages");
  },
};
