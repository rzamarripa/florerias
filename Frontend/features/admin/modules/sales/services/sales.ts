import { apiCall } from "@/utils/api";
import { Sale, SaleFilters, GetSalesResponse, GetSaleResponse } from "../types";

export const salesService = {
  getAllSales: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    const {
      page = 1,
      limit = 15,
      status,
      salesChannel,
      clientName,
      orderNumber,
      paymentMethodId,
      startDate,
      endDate,
      branchId,
    } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) searchParams.append('status', status);
    if (salesChannel) searchParams.append('salesChannel', salesChannel);
    if (clientName) searchParams.append('clientName', clientName);
    if (orderNumber) searchParams.append('orderNumber', orderNumber);
    if (paymentMethodId) searchParams.append('paymentMethodId', paymentMethodId);
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<GetSalesResponse>(`/orders?${searchParams}`);
    return response as any;
  },

  getSaleById: async (saleId: string): Promise<GetSaleResponse> => {
    const response = await apiCall<GetSaleResponse>(`/orders/${saleId}`);
    return response as any;
  },

  // Método específico para ventas nuevas (del día actual)
  getNewSales: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    const today = new Date().toISOString().split('T')[0];
    return salesService.getAllSales({
      ...filters,
      startDate: filters.startDate || today,
      endDate: filters.endDate || today,
    });
  },

  // Método específico para ventas a crédito
  getCreditSales: async (creditPaymentMethodId: string, filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    return salesService.getAllSales({
      ...filters,
      paymentMethodId: creditPaymentMethodId,
    });
  },

  // Método específico para ventas pendientes de pago
  getPendingSales: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    return salesService.getAllSales({
      ...filters,
      status: 'pendiente',
    });
  },

  // Método específico para ventas canceladas
  getCancelledSales: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    return salesService.getAllSales({
      ...filters,
      status: 'cancelado',
    });
  },

  deleteSale: async (saleId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/orders/${saleId}`, {
      method: "DELETE",
    });
    return response;
  },

  // Obtener resumen de ventas
  getSalesSummary: async (filters: { startDate?: string; endDate?: string; branchId?: string } = {}): Promise<{
    success: boolean;
    data: {
      totalSales: { count: number; amount: number };
      pendingPayment: { count: number; amount: number };
      paidSales: { count: number; amount: number };
      cancelledSales: { count: number; amount: number };
    };
  }> => {
    const { startDate, endDate, branchId } = filters;

    const searchParams = new URLSearchParams();

    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<{
      success: boolean;
      data: {
        totalSales: { count: number; amount: number };
        pendingPayment: { count: number; amount: number };
        paidSales: { count: number; amount: number };
        cancelledSales: { count: number; amount: number };
      };
    }>(`/orders/summary?${searchParams}`);
    return response as any;
  },
};
