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
  getCreditSales: async (filters: SaleFilters & { creditPaymentMethodId?: string } = {}): Promise<GetSalesResponse> => {
    const { creditPaymentMethodId, ...otherFilters } = filters;
    return salesService.getAllSales({
      ...otherFilters,
      paymentMethodId: creditPaymentMethodId,
    });
  },

  // Método específico para ventas de intercambio
  getExchangeSales: async (filters: SaleFilters & { exchangePaymentMethodId?: string } = {}): Promise<GetSalesResponse> => {
    const { exchangePaymentMethodId, ...otherFilters } = filters;
    return salesService.getAllSales({
      ...otherFilters,
      paymentMethodId: exchangePaymentMethodId,
    });
  },

  // Método específico para ventas pendientes de pago
  getPendingSales: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    return salesService.getAllSales({
      ...filters,
      status: 'pendiente',
    });
  },

  // Método específico para pagos pendientes (remainingBalance > 0)
  getPendingPayments: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    return salesService.getAllSales({
      ...filters,
      // El backend ya filtra automáticamente por remainingBalance > 0
    });
  },

  // Método específico para ventas canceladas
  getCancelledSales: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    return salesService.getAllSales({
      ...filters,
      status: 'cancelado',
    });
  },

  // Método específico para ventas sin autorizar (con descuento pendiente)
  getUnauthorizedSales: async (filters: SaleFilters = {}): Promise<GetSalesResponse> => {
    const { startDate, endDate, branchId, page = 1, limit = 15 } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<GetSalesResponse>(`/orders/unauthorized?${searchParams}`);
    return response as any;
  },

  deleteSale: async (saleId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/orders/${saleId}`, {
      method: "DELETE",
    });
    return response;
  },

  updateOrderStatus: async (saleId: string, status: string): Promise<{ success: boolean; message: string; data: Sale }> => {
    const response = await apiCall<{ success: boolean; message: string; data: Sale }>(`/orders/${saleId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    return response as any;
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

  // Actualizar información de entrega de una venta
  updateSaleDeliveryInfo: async (
    saleId: string,
    data: { message: string; deliveryDateTime: string }
  ): Promise<{ success: boolean; message: string; data: Sale }> => {
    const response = await apiCall<{ success: boolean; message: string; data: Sale }>(
      `/orders/${saleId}/delivery`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },
};
