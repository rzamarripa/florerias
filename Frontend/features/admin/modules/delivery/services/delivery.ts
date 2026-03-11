import { apiCall } from "@/utils/api";
import {
  Delivery,
  DeliveryFilters,
  CreateDeliveryData,
  CreateDeliveryResponseData,
  GetDeliveryResponse,
  UpdateDeliveryData,
} from "../types";

export const deliveryService = {
  getAllDelivery: async (filters: DeliveryFilters = {}): Promise<GetDeliveryResponse> => {
    const { page = 1, limit = 10, search, estatus } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());

    const response = await apiCall<Delivery[]>(`/delivery-drivers?${searchParams}`);
    return response as any;
  },

  getDeliveryById: async (deliveryId: string): Promise<{ success: boolean; data: Delivery }> => {
    const response = await apiCall<Delivery>(`/delivery-drivers/${deliveryId}`);
    return response as any;
  },

  createDelivery: async (deliveryData: CreateDeliveryData): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<Delivery>("/delivery-drivers", {
      method: "POST",
      body: JSON.stringify(deliveryData),
    });
    return response as any;
  },

  updateDelivery: async (
    deliveryId: string,
    deliveryData: UpdateDeliveryData
  ): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<Delivery>(`/delivery-drivers/${deliveryId}`, {
      method: "PUT",
      body: JSON.stringify(deliveryData),
    });
    return response as any;
  },

  deleteDelivery: async (deliveryId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<null>(`/delivery-drivers/${deliveryId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  activateDelivery: async (deliveryId: string): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<Delivery>(`/delivery-drivers/${deliveryId}/activate`, {
      method: "PUT",
    });
    return response as any;
  },

  deactivateDelivery: async (deliveryId: string): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<Delivery>(`/delivery-drivers/${deliveryId}/deactivate`, {
      method: "PUT",
    });
    return response as any;
  },
};
