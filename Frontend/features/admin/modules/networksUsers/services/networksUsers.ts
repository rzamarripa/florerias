import { apiCall } from "@/utils/api";
import {
  NetworksUser,
  NetworksUserFilters,
  CreateNetworksUserData,
  CreateNetworksUserResponseData,
  GetNetworksUsersResponse,
  UpdateNetworksUserData,
} from "../types";

export const networksUsersService = {
  getAllNetworksUsers: async (filters: NetworksUserFilters = {}): Promise<GetNetworksUsersResponse> => {
    const { page = 1, limit = 10, search, estatus, companyId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());
    if (companyId) searchParams.append('companyId', companyId);

    const response = await apiCall<NetworksUser[]>(`/networks-users?${searchParams}`);
    return response as any;
  },

  getNetworksUserById: async (userId: string): Promise<{ success: boolean; data: NetworksUser }> => {
    const response = await apiCall<NetworksUser>(`/networks-users/${userId}`);
    return response as any;
  },

  createNetworksUser: async (userData: CreateNetworksUserData): Promise<CreateNetworksUserResponseData> => {
    const response = await apiCall<NetworksUser>("/networks-users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return response as any;
  },

  updateNetworksUser: async (
    userId: string,
    userData: UpdateNetworksUserData
  ): Promise<{ success: boolean; data: NetworksUser; message: string }> => {
    const response = await apiCall<NetworksUser>(`/networks-users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return response as any;
  },

  deleteNetworksUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<null>(`/networks-users/${userId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  activateNetworksUser: async (userId: string): Promise<{ success: boolean; data: NetworksUser; message: string }> => {
    const response = await apiCall<NetworksUser>(`/networks-users/${userId}/activate`, {
      method: "PUT",
    });
    return response as any;
  },

  deactivateNetworksUser: async (userId: string): Promise<{ success: boolean; data: NetworksUser; message: string }> => {
    const response = await apiCall<NetworksUser>(`/networks-users/${userId}/deactivate`, {
      method: "PUT",
    });
    return response as any;
  },
};