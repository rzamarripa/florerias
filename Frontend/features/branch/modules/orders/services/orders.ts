import { apiCall } from "@/utils/api";
import {
  Order,
  OrderFilters,
  CreateOrderData,
  CreateOrderResponseData,
  GetOrdersResponse,
  UpdateOrderData,
} from "../types";

export const ordersService = {
  getAllOrders: async (filters: OrderFilters = {}): Promise<GetOrdersResponse> => {
    const { page = 1, limit = 10, status, salesChannel, clientName, orderNumber } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (clientName) searchParams.append('clientName', clientName);
    if (status) searchParams.append('status', status);
    if (salesChannel) searchParams.append('salesChannel', salesChannel);
    if (orderNumber) searchParams.append('orderNumber', orderNumber);

    const response = await apiCall<GetOrdersResponse>(`/orders?${searchParams}`);
    return response;
  },

  getOrderById: async (orderId: string): Promise<{ success: boolean; data: Order }> => {
    const response = await apiCall<{ success: boolean; data: Order }>(`/orders/${orderId}`);
    return response;
  },

  createOrder: async (orderData: CreateOrderData): Promise<CreateOrderResponseData> => {
    const response = await apiCall<CreateOrderResponseData>("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    return response;
  },

  updateOrder: async (
    orderId: string,
    orderData: UpdateOrderData
  ): Promise<CreateOrderResponseData> => {
    const response = await apiCall<CreateOrderResponseData>(`/orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    });
    return response;
  },

  updateOrderStatus: async (
    orderId: string,
    status: 'pendiente' | 'en-proceso' | 'completado' | 'cancelado'
  ): Promise<CreateOrderResponseData> => {
    const response = await apiCall<CreateOrderResponseData>(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    return response;
  },

  deleteOrder: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/orders/${orderId}`, {
      method: "DELETE",
    });
    return response;
  },
};
