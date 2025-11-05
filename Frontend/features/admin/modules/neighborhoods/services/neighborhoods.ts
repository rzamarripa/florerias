import { apiCall } from "@/utils/api";
import {
  Neighborhood,
  NeighborhoodFilters,
  CreateNeighborhoodData,
  GetNeighborhoodsResponse,
  UpdateNeighborhoodData,
} from "../types";

export const neighborhoodsService = {
  getAllNeighborhoods: async (filters: NeighborhoodFilters = {}): Promise<GetNeighborhoodsResponse> => {
    const { page = 1, limit = 10, status, search } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) searchParams.append('status', status);
    if (search) searchParams.append('search', search);

    const response = await apiCall<GetNeighborhoodsResponse>(`/neighborhoods?${searchParams}`);
    return response;
  },

  getNeighborhoodById: async (neighborhoodId: string): Promise<{ success: boolean; data: Neighborhood }> => {
    const response = await apiCall<{ success: boolean; data: Neighborhood }>(`/neighborhoods/${neighborhoodId}`);
    return response;
  },

  createNeighborhood: async (neighborhoodData: CreateNeighborhoodData): Promise<{ success: boolean; data: Neighborhood; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Neighborhood; message: string }>("/neighborhoods", {
      method: "POST",
      body: JSON.stringify(neighborhoodData),
    });
    return response;
  },

  updateNeighborhood: async (
    neighborhoodId: string,
    neighborhoodData: UpdateNeighborhoodData
  ): Promise<{ success: boolean; data: Neighborhood; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Neighborhood; message: string }>(`/neighborhoods/${neighborhoodId}`, {
      method: "PUT",
      body: JSON.stringify(neighborhoodData),
    });
    return response;
  },

  deleteNeighborhood: async (neighborhoodId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/neighborhoods/${neighborhoodId}`, {
      method: "DELETE",
    });
    return response;
  },
};
