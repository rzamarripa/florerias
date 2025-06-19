import { apiCall } from "../../../../../utils/api";

export const bankAccountsService = {
  getAll: async (params: any) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await apiCall(`/bank-accounts?${query}`);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  getActiveCount: async (params: any) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await apiCall(`/bank-accounts/count/active?${query}`);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiCall("/bank-accounts", {
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
      const response = await apiCall(`/bank-accounts/${id}`, {
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
      const response = await apiCall(`/bank-accounts/${id}`, {
        method: "DELETE",
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  activate: async (id: string) => {
    try {
      const response = await apiCall(`/bank-accounts/${id}/active`, {
        method: "PUT",
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
};
