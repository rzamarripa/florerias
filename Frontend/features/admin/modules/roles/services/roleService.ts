import { apiCall, ApiResponse } from "@/utils/api";

export const roleService = {
  getAll: async () => {
    return await apiCall("/roles");
  },

  getById: async (id: string) => {
    return await apiCall(`/roles/${id}`);
  },

  create: async (data: any) => {
    return await apiCall("/roles", {
      method: "POST",
      data,
    });
  },

  update: async (id: string, data: any) => {
    return await apiCall(`/roles/${id}`, {
      method: "PUT",
      data,
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
