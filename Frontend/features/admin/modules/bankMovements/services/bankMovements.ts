import { apiCall, ApiResponse } from "../../../../../utils/api";
import { BankAccount } from "../../bankAccounts/types";
import { Company } from "../../companies/types";

export const bankMovementsService = {
  importMovements: async (payload: {
    company: string;
    bankAccount: string;
    movimientos: any[];
    finalBalance: number | null;
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
  getCompanies: async (): Promise<ApiResponse<Company[]>> => {
    try {
      const response = await apiCall<Company[]>("/companies/all");
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
  getBankAccounts: async (
    companyId: string
  ): Promise<ApiResponse<BankAccount[]>> => {
    try {
      const response = await apiCall<BankAccount[]>(
        `/bank-accounts?company=${companyId}`
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },
  getCurrentBalance: async (
    bankAccountId: string
  ): Promise<ApiResponse<BankAccount | null>> => {
    try {
      const response = await apiCall<BankAccount>(
        `/bank-accounts/${bankAccountId}`
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: null };
    }
  },
  updateBankAccount: async (id: string, data: Partial<BankAccount>) => {
    try {
      const response = await apiCall(`/bank-accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response;
    } catch (error: any) {
      return { success: false, message: error.message, data: null };
    }
  },
};
