import { apiCall } from "../../../../../utils/api";

export const bankMovementsService = {
  importMovements: async (payload: {
    company: string;
    bankAccount: string;
    movimientos: any[];
  }) => {
    try {
      const response = await apiCall("/bank-movements/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: null };
    }
  },
  getCompanies: async () => {
    try {
      const response = await apiCall("/companies/all");
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
  getBankAccounts: async (companyId: string) => {
    try {
      const response = await apiCall(`/bank-accounts?company=${companyId}`);
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
};
