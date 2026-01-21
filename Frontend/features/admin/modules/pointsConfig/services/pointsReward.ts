import { apiCall } from "@/utils/api";
import {
  PointsReward,
  PointsRewardFilters,
  CreatePointsRewardData,
  UpdatePointsRewardData,
  GetPointsRewardsResponse,
  PointsRewardResponse,
} from "../types";

export const pointsRewardService = {
  getAllPointsRewards: async (
    filters: PointsRewardFilters = {}
  ): Promise<GetPointsRewardsResponse> => {
    const { page = 1, limit = 100, branchId, status, rewardType } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (branchId) searchParams.append("branchId", branchId);
    if (status !== undefined) searchParams.append("status", status.toString());
    if (rewardType) searchParams.append("rewardType", rewardType);

    const response = await apiCall<GetPointsRewardsResponse>(
      `/points-rewards?${searchParams}`
    );
    return response;
  },

  getPointsRewardById: async (
    rewardId: string
  ): Promise<{ success: boolean; data: PointsReward }> => {
    const response = await apiCall<{ success: boolean; data: PointsReward }>(
      `/points-rewards/${rewardId}`
    );
    return response;
  },

  getPointsRewardsByBranch: async (
    branchId: string,
    filters: PointsRewardFilters = {},
    includeGlobal: boolean = false
  ): Promise<GetPointsRewardsResponse> => {
    const { page = 1, limit = 100, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      includeGlobal: includeGlobal.toString(),
    });

    if (status !== undefined) searchParams.append("status", status.toString());

    const response = await apiCall<GetPointsRewardsResponse>(
      `/points-rewards/branch/${branchId}?${searchParams}`
    );
    return response;
  },

  createPointsReward: async (
    data: CreatePointsRewardData
  ): Promise<PointsRewardResponse> => {
    const response = await apiCall<PointsRewardResponse>("/points-rewards", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },

  updatePointsReward: async (
    rewardId: string,
    data: UpdatePointsRewardData
  ): Promise<PointsRewardResponse> => {
    const response = await apiCall<PointsRewardResponse>(
      `/points-rewards/${rewardId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response;
  },

  deletePointsReward: async (
    rewardId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(
      `/points-rewards/${rewardId}`,
      {
        method: "DELETE",
      }
    );
    return response;
  },

  activatePointsReward: async (
    rewardId: string
  ): Promise<PointsRewardResponse> => {
    const response = await apiCall<PointsRewardResponse>(
      `/points-rewards/${rewardId}/activate`,
      {
        method: "PUT",
      }
    );
    return response;
  },

  getPointsRewardsByCompany: async (
    companyId: string,
    filters: PointsRewardFilters = {}
  ): Promise<GetPointsRewardsResponse> => {
    const { page = 1, limit = 100, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status !== undefined) searchParams.append("status", status.toString());

    const response = await apiCall<GetPointsRewardsResponse>(
      `/points-rewards/company/${companyId}?${searchParams}`
    );
    return response;
  },
};
