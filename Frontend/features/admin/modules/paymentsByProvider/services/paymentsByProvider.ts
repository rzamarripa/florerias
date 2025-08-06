import { apiCall } from "@/utils/api";
import { PaymentByProvider, GroupInvoicesRequest, GroupInvoicesResponse, GetPaymentsByProviderParams, ApiResponse } from "../types";

export const groupInvoicesByProvider = async (data: GroupInvoicesRequest): Promise<GroupInvoicesResponse> => {
  const response = await apiCall<PaymentByProvider[]>("/payments-by-provider/group-invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
};

export const getPaymentsByProvider = async (params?: GetPaymentsByProviderParams): Promise<ApiResponse<PaymentByProvider[]>> => {
  let url = "/payments-by-provider";
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.append(key, String(value));
    });
    if (Array.from(query).length > 0) url += `?${query.toString()}`;
  }
  return apiCall(url);
}; 