import { apiCall } from "@/utils/api";
import { GetBankAccountsResponse } from "../types";

export const bankAccountsService = {
  getBankAccountsByCompany: async (companyId: string): Promise<GetBankAccountsResponse> => {
    const response = await apiCall<GetBankAccountsResponse["data"]>(
      `/bank-accounts/by-company/${companyId}`
    );
    return response;
  },
}; 