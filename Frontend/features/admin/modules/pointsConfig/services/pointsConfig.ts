import { apiCall } from "@/utils/api";
import {
  PointsConfig,
  PointsConfigFilters,
  CreatePointsConfigData,
  UpdatePointsConfigData,
  GetPointsConfigsResponse,
  PointsConfigResponse,
} from "../types";

export const pointsConfigService = {
  getAllPointsConfigs: async (
    filters: PointsConfigFilters = {}
  ): Promise<GetPointsConfigsResponse> => {
    const { page = 1, limit = 10, branchId, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (branchId) searchParams.append("branchId", branchId);
    if (status !== undefined) searchParams.append("status", status.toString());

    const response = await apiCall<GetPointsConfigsResponse>(
      `/points-config?${searchParams}`
    );
    return response;
  },

  getPointsConfigById: async (
    configId: string
  ): Promise<{ success: boolean; data: PointsConfig }> => {
    const response = await apiCall<{ success: boolean; data: PointsConfig }>(
      `/points-config/${configId}`
    );
    return response;
  },

  getPointsConfigByBranch: async (
    branchId: string
  ): Promise<{ success: boolean; data: PointsConfig }> => {
    const response = await apiCall<{ success: boolean; data: PointsConfig }>(
      `/points-config/branch/${branchId}`
    );
    return response;
  },

  createPointsConfig: async (
    data: CreatePointsConfigData
  ): Promise<PointsConfigResponse> => {
    const response = await apiCall<PointsConfigResponse>("/points-config", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },

  updatePointsConfig: async (
    configId: string,
    data: UpdatePointsConfigData
  ): Promise<PointsConfigResponse> => {
    const response = await apiCall<PointsConfigResponse>(
      `/points-config/${configId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response;
  },

  deletePointsConfig: async (
    configId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(
      `/points-config/${configId}`,
      {
        method: "DELETE",
      }
    );
    return response;
  },

  activatePointsConfig: async (
    configId: string
  ): Promise<PointsConfigResponse> => {
    const response = await apiCall<PointsConfigResponse>(
      `/points-config/${configId}/activate`,
      {
        method: "PUT",
      }
    );
    return response;
  },
};
