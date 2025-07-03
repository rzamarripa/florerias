import { apiCall } from "@/utils/api";
import { CashPayment, CashPaymentFormData, CashPaymentResponse, CashPaymentListResponse } from "../types";

export const cashPaymentService = {
    getAll: async (params: { page?: number; limit?: number } = {}) => {
        const { page = 1, limit = 10 } = params;
        const searchParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        return await apiCall<CashPayment[]>(`/cash-payments?${searchParams}`);
    },
    getById: async (id: string) => {
        return await apiCall<CashPaymentResponse>(`/cash-payments/${id}`);
    },
    create: async (data: CashPaymentFormData) => {
        return await apiCall<CashPaymentResponse>("/cash-payments", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    update: async (id: string, data: CashPaymentFormData) => {
        return await apiCall<CashPaymentResponse>(`/cash-payments/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    delete: async (id: string) => {
        return await apiCall<CashPaymentResponse>(`/cash-payments/${id}`, {
            method: "DELETE",
        });
    },
};

export const {
    getAll: getCashPayments,
    getById: getCashPaymentById,
    create: createCashPayment,
    update: updateCashPayment,
    delete: deleteCashPayment,
} = cashPaymentService; 