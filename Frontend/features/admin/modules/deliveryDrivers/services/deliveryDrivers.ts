import { apiCall } from "@/utils/api";
import {
  DeliveryDriver,
  DeliveryDriverFilters,
  CreateDeliveryDriverData,
  CreateDeliveryDriverResponseData,
  GetDeliveryDriversResponse,
  UpdateDeliveryDriverData,
} from "../types";

export const deliveryDriversService = {
  getAllDeliveryDrivers: async (filters: DeliveryDriverFilters = {}): Promise<GetDeliveryDriversResponse> => {
    const { page = 1, limit = 10, search, estatus, branchId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<DeliveryDriver[]>(`/delivery-drivers?${searchParams}`);
    return response as any;
  },

  getDeliveryDriverById: async (driverId: string): Promise<{ success: boolean; data: DeliveryDriver }> => {
    const response = await apiCall<DeliveryDriver>(`/delivery-drivers/${driverId}`);
    return response as any;
  },

  createDeliveryDriver: async (driverData: CreateDeliveryDriverData): Promise<CreateDeliveryDriverResponseData> => {
    const response = await apiCall<DeliveryDriver>("/delivery-drivers", {
      method: "POST",
      body: JSON.stringify(driverData),
    });
    return response as any;
  },

  updateDeliveryDriver: async (
    driverId: string,
    driverData: UpdateDeliveryDriverData
  ): Promise<CreateDeliveryDriverResponseData> => {
    const response = await apiCall<DeliveryDriver>(`/delivery-drivers/${driverId}`, {
      method: "PUT",
      body: JSON.stringify(driverData),
    });
    return response as any;
  },

  deleteDeliveryDriver: async (driverId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<null>(`/delivery-drivers/${driverId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  activateDeliveryDriver: async (driverId: string): Promise<CreateDeliveryDriverResponseData> => {
    const response = await apiCall<DeliveryDriver>(`/delivery-drivers/${driverId}/activate`, {
      method: "PUT",
    });
    return response as any;
  },

  deactivateDeliveryDriver: async (driverId: string): Promise<CreateDeliveryDriverResponseData> => {
    const response = await apiCall<DeliveryDriver>(`/delivery-drivers/${driverId}/deactivate`, {
      method: "PUT",
    });
    return response as any;
  },
};