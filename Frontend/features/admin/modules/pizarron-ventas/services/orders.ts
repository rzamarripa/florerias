import { apiCall } from "@/utils/api";
import { Order, OrderFilters, OrdersResponse } from "../types";

export const ordersService = {
  getAllOrders: async (filters: OrderFilters = {}): Promise<OrdersResponse> => {
    const { page = 1, limit = 50, status, searchTerm, product } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) searchParams.append('status', status);
    if (searchTerm) searchParams.append('search', searchTerm);
    if (product) searchParams.append('product', product);

    const response = await apiCall<OrdersResponse>(`/orders?${searchParams}`);
    return response;
  },

  getOrderById: async (orderId: string): Promise<{ success: boolean; data: Order }> => {
    const response = await apiCall<{ success: boolean; data: Order }>(`/orders/${orderId}`);
    return response;
  },

  updateOrderStatus: async (
    orderId: string,
    status: string
  ): Promise<{ success: boolean; data: Order; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Order; message: string }>(
      `/orders/${orderId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );
    return response;
  },
};
