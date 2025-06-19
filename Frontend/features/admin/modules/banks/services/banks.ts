import { apiCall } from "../../../../../utils/api";

export const banksService = {
  getAll: async (params: any) => {
    try {
      // Construir query string
      const query = new URLSearchParams(params).toString();
      const response = await apiCall(`/banks?${query}`);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiCall("/banks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiCall(`/banks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiCall(`/banks/${id}`, {
        method: "DELETE",
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  activate: async (id: string) => {
    try {
      const response = await apiCall(`/banks/${id}/active`, {
        method: "PUT",
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  // Aquí puedes agregar más métodos (crear, actualizar, eliminar, etc.)
};
