import { apiCall } from "@/utils/api";
import {
  SalesChannel,
  SalesChannelFilters,
  CreateSalesChannelData,
  GetSalesChannelsResponse,
  UpdateSalesChannelData,
} from "../types";

export const salesChannelsService = {
  getAllSalesChannels: async (filters: SalesChannelFilters = {}): Promise<GetSalesChannelsResponse> => {
    const { page = 1, limit = 10, status, search, companyId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) searchParams.append('status', status);
    if (search) searchParams.append('search', search);
    if (companyId) searchParams.append('companyId', companyId);

    const response = await apiCall<GetSalesChannelsResponse>(`/sales-channels?${searchParams}`);
    return response;
  },

  getSalesChannelById: async (channelId: string): Promise<{ success: boolean; data: SalesChannel }> => {
    const response = await apiCall<{ success: boolean; data: SalesChannel }>(`/sales-channels/${channelId}`);
    return response;
  },

  createSalesChannel: async (channelData: CreateSalesChannelData): Promise<{ success: boolean; data: SalesChannel; message: string }> => {
    const response = await apiCall<{ success: boolean; data: SalesChannel; message: string }>("/sales-channels", {
      method: "POST",
      body: JSON.stringify(channelData),
    });
    return response;
  },

  updateSalesChannel: async (
    channelId: string,
    channelData: UpdateSalesChannelData
  ): Promise<{ success: boolean; data: SalesChannel; message: string }> => {
    const response = await apiCall<{ success: boolean; data: SalesChannel; message: string }>(`/sales-channels/${channelId}`, {
      method: "PUT",
      body: JSON.stringify(channelData),
    });
    return response;
  },

  deleteSalesChannel: async (channelId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/sales-channels/${channelId}`, {
      method: "DELETE",
    });
    return response;
  },
};