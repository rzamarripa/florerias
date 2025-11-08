import { apiCall } from "@/utils/api";
import { Order, OrderFilters, OrdersResponse } from "../types";

export const ordersService = {
  getAllOrders: async (filters: OrderFilters = {}): Promise<OrdersResponse> => {
    const { page = 1, limit = 50, status, searchTerm, product, branchId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) searchParams.append('status', status);
    if (searchTerm) searchParams.append('search', searchTerm);
    if (product) searchParams.append('product', product);
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<Order[]>(`/orders?${searchParams}`);
    return {
      data: response.data,
      pagination: response.pagination
    };
  },

  getOrderById: async (orderId: string): Promise<{ success: boolean; data: Order }> => {
    const response = await apiCall<Order>(`/orders/${orderId}`);
    return {
      success: response.success,
      data: response.data
    };
  },

  updateOrderStatus: async (
    orderId: string,
    status: string
  ): Promise<{ success: boolean; data: Order; message: string }> => {
    const response = await apiCall<Order>(
      `/orders/${orderId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message
    };
  },
};
