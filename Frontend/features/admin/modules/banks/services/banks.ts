import { apiCall } from "@/utils/api";
import { Bank } from "../types";

export const banksService = {
  getAll: async (params: any) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await apiCall<Bank[]>(`/banks?${query}`);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiCall<Bank>("/banks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiCall<Bank>(`/banks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiCall<Bank>(`/banks/${id}`, {
        method: "DELETE",
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
  activate: async (id: string) => {
    try {
      const response = await apiCall<Bank>(`/banks/${id}/active`, {
        method: "PUT",
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
};
