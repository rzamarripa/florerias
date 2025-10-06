import { apiCall } from "@/utils/api";
import {
  PaymentMethod,
  PaymentMethodFilters,
  CreatePaymentMethodData,
  GetPaymentMethodsResponse,
  UpdatePaymentMethodData,
} from "../types";

export const paymentMethodsService = {
  getAllPaymentMethods: async (filters: PaymentMethodFilters = {}): Promise<GetPaymentMethodsResponse> => {
    const { page = 1, limit = 1000, name, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (name) searchParams.append('name', name);
    if (status !== undefined) searchParams.append('status', status.toString());

    const response = await apiCall<GetPaymentMethodsResponse>(`/payment-methods?${searchParams}`);
    return response;
  },

  getPaymentMethodById: async (paymentMethodId: string): Promise<{ success: boolean; data: PaymentMethod }> => {
    const response = await apiCall<{ success: boolean; data: PaymentMethod }>(`/payment-methods/${paymentMethodId}`);
    return response;
  },

  createPaymentMethod: async (paymentMethodData: CreatePaymentMethodData): Promise<{ success: boolean; data: PaymentMethod; message: string }> => {
    const response = await apiCall<{ success: boolean; data: PaymentMethod; message: string }>("/payment-methods", {
      method: "POST",
      body: JSON.stringify(paymentMethodData),
    });
    return response;
  },

  updatePaymentMethod: async (
    paymentMethodId: string,
    paymentMethodData: UpdatePaymentMethodData
  ): Promise<{ success: boolean; data: PaymentMethod; message: string }> => {
    const response = await apiCall<{ success: boolean; data: PaymentMethod; message: string }>(`/payment-methods/${paymentMethodId}`, {
      method: "PUT",
      body: JSON.stringify(paymentMethodData),
    });
    return response;
  },

  updatePaymentMethodStatus: async (
    paymentMethodId: string,
    status: boolean
  ): Promise<{ success: boolean; data: PaymentMethod; message: string }> => {
    const response = await apiCall<{ success: boolean; data: PaymentMethod; message: string }>(`/payment-methods/${paymentMethodId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    return response;
  },

  deletePaymentMethod: async (paymentMethodId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/payment-methods/${paymentMethodId}`, {
      method: "DELETE",
    });
    return response;
  },
};
