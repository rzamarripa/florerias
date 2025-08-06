import { apiCall } from "@/utils/api";

export interface PaymentByProvider {
  _id: string;
  groupingFolio: string;
  totalAmount: number;
  providerRfc: string;
  providerName: string;
  branchName: string;
  companyProvider: string;
  bankNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupInvoicesRequest {
  packageIds: string[];
  bankAccountId: string;
}

export interface GroupInvoicesResponse {
  success: boolean;
  message: string;
  data: PaymentByProvider[];
}

export const groupInvoicesByProvider = async (data: GroupInvoicesRequest): Promise<GroupInvoicesResponse> => {
  const response = await apiCall<GroupInvoicesResponse>("/payments-by-provider/group-invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
};

export const getPaymentsByProvider = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ success: boolean; data: PaymentByProvider[]; pagination?: any }> => {
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