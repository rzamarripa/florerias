import { apiCall, ApiResponse } from "@/utils/api";

export const roleService = {
  getAll: async () => {
    return await apiCall<any>("/roles");
  },

  getById: async (id: string) => {
    return await apiCall(`/roles/${id}`);
  },

  create: async (data: any) => {
    return await apiCall<any>("/roles", {
      method: "POST",
      body: data,
    });
  },

  update: async (id: string, data: any) => {
    return await apiCall<any>(`/roles/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  delete: async (id: string) => {
    return await apiCall(`/roles/${id}`, {
      method: "DELETE",
    });
  },

  getModules: async () => {
    return await apiCall("/modules");
  },
};
