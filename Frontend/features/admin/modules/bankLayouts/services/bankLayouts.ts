import { apiCall } from "@/utils/api";
import { BankLayout, GetBankLayoutsParams, ApiResponse } from "../types";

export const getBankLayouts = async (params?: GetBankLayoutsParams): Promise<ApiResponse<BankLayout[]>> => {
  let url = "/payments-by-provider/bank-layouts";
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.append(key, String(value));
    });
    if (Array.from(query).length > 0) url += `?${query.toString()}`;
  }
  return apiCall(url);
};

export const revertBankLayout = async (layoutId: string): Promise<ApiResponse<any>> => {
  return await apiCall(`/payments-by-provider/revert-layout/${layoutId}`, {
    method: "DELETE",
  });
};