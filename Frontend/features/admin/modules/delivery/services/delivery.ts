import { apiCall } from "@/utils/api";
import {
  Delivery,
  DeliveryFilters,
  CreateDeliveryData,
  CreateDeliveryResponseData,
  GetDeliveryResponse,
  UpdateDeliveryData,
  Dealer,
  DealerFilters,
  CreateDealerData,
  CreateDealerResponseData,
  GetDealersResponse,
  UpdateDealerData,
} from "../types";

export const deliveryService = {
  getAllDelivery: async (filters: DeliveryFilters = {}): Promise<GetDeliveryResponse> => {
    const { page = 1, limit = 10, nombre, apellidoPaterno, usuario, correo, telefono, estatus } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (nombre) searchParams.append('nombre', nombre);
    if (apellidoPaterno) searchParams.append('apellidoPaterno', apellidoPaterno);
    if (usuario) searchParams.append('usuario', usuario);
    if (correo) searchParams.append('correo', correo);
    if (telefono) searchParams.append('telefono', telefono);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());

    const response = await apiCall<GetDeliveryResponse>(`/delivery?${searchParams}`);
    return response;
  },

  getDeliveryById: async (deliveryId: string): Promise<{ success: boolean; data: Delivery }> => {
    const response = await apiCall<{ success: boolean; data: Delivery }>(`/delivery/${deliveryId}`);
    return response;
  },

  createDelivery: async (deliveryData: CreateDeliveryData): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<CreateDeliveryResponseData>("/delivery", {
      method: "POST",
      body: JSON.stringify(deliveryData),
    });
    return response;
  },

  updateDelivery: async (
    deliveryId: string,
    deliveryData: UpdateDeliveryData
  ): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<CreateDeliveryResponseData>(`/delivery/${deliveryId}`, {
      method: "PUT",
      body: JSON.stringify(deliveryData),
    });
    return response;
  },

  deleteDelivery: async (deliveryId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/delivery/${deliveryId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateDelivery: async (deliveryId: string): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<CreateDeliveryResponseData>(`/delivery/${deliveryId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateDelivery: async (deliveryId: string): Promise<CreateDeliveryResponseData> => {
    const response = await apiCall<CreateDeliveryResponseData>(`/delivery/${deliveryId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },
};

// Dealer service
export const dealerService = {
  getAllDealers: async (filters: DealerFilters = {}): Promise<GetDealersResponse> => {
    const { page = 1, limit = 10, nombre, apellidoPaterno, usuario, correo, telefono, estatus } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (nombre) searchParams.append('nombre', nombre);
    if (apellidoPaterno) searchParams.append('apellidoPaterno', apellidoPaterno);
    if (usuario) searchParams.append('usuario', usuario);
    if (correo) searchParams.append('correo', correo);
    if (telefono) searchParams.append('telefono', telefono);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());

    const response = await apiCall<GetDealersResponse>(`/delivery?${searchParams}`);
    return response;
  },

  getDealerById: async (dealerId: string): Promise<{ success: boolean; data: Dealer }> => {
    const response = await apiCall<{ success: boolean; data: Dealer }>(`/delivery/${dealerId}`);
    return response;
  },

  createDealer: async (dealerData: CreateDealerData): Promise<CreateDealerResponseData> => {
    const response = await apiCall<CreateDealerResponseData>("/delivery", {
      method: "POST",
      body: JSON.stringify(dealerData),
    });
    return response;
  },

  updateDealer: async (
    dealerId: string,
    dealerData: UpdateDealerData
  ): Promise<CreateDealerResponseData> => {
    const response = await apiCall<CreateDealerResponseData>(`/delivery/${dealerId}`, {
      method: "PUT",
      body: JSON.stringify(dealerData),
    });
    return response;
  },

  deleteDealer: async (dealerId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/delivery/${dealerId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateDealer: async (dealerId: string): Promise<CreateDealerResponseData> => {
    const response = await apiCall<CreateDealerResponseData>(`/delivery/${dealerId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateDealer: async (dealerId: string): Promise<CreateDealerResponseData> => {
    const response = await apiCall<CreateDealerResponseData>(`/delivery/${dealerId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },
};