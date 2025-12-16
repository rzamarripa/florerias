import { apiCall } from "@/utils/api";
import {
  Client,
  ClientFilters,
  CreateClientData,
  CreateClientResponseData,
  GetClientsResponse,
  UpdateClientData,
  AddCommentData,
  AddCommentResponse,
  GetClientPointsHistoryResponse,
  ClientPointsHistoryFilters,
  RedeemRewardData,
  RedeemRewardResponse,
  VerifyRewardCodeData,
  VerifyRewardCodeResponse,
  GetAvailableRewardsResponse,
} from "../types";

export const clientsService = {
  getAllClients: async (filters: ClientFilters = {}): Promise<GetClientsResponse> => {
    const { page = 1, limit = 10, name, lastName, clientNumber, phoneNumber, status, branchId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (name) searchParams.append('name', name);
    if (lastName) searchParams.append('lastName', lastName);
    if (clientNumber) searchParams.append('clientNumber', clientNumber);
    if (phoneNumber) searchParams.append('phoneNumber', phoneNumber);
    if (status !== undefined) searchParams.append('status', status.toString());
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<GetClientsResponse>(`/clients?${searchParams}`);
    return response;
  },

  getClientById: async (clientId: string): Promise<{ success: boolean; data: Client }> => {
    const response = await apiCall<{ success: boolean; data: Client }>(`/clients/${clientId}`);
    return response;
  },

  createClient: async (clientData: CreateClientData): Promise<CreateClientResponseData> => {
    const response = await apiCall<CreateClientResponseData>("/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
    return response;
  },

  updateClient: async (
    clientId: string,
    clientData: UpdateClientData
  ): Promise<CreateClientResponseData> => {
    const response = await apiCall<CreateClientResponseData>(`/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
    return response;
  },

  deleteClient: async (clientId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/clients/${clientId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateClient: async (clientId: string): Promise<CreateClientResponseData> => {
    const response = await apiCall<CreateClientResponseData>(`/clients/${clientId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  addPoints: async (
    clientId: string,
    points: number
  ): Promise<CreateClientResponseData> => {
    const response = await apiCall<CreateClientResponseData>(`/clients/${clientId}/add-points`, {
      method: "PUT",
      body: JSON.stringify({ points }),
    });
    return response;
  },

  usePoints: async (
    clientId: string,
    points: number
  ): Promise<CreateClientResponseData> => {
    const response = await apiCall<CreateClientResponseData>(`/clients/${clientId}/use-points`, {
      method: "PUT",
      body: JSON.stringify({ points }),
    });
    return response;
  },

  addComment: async (
    clientId: string,
    commentData: AddCommentData
  ): Promise<AddCommentResponse> => {
    const response = await apiCall<AddCommentResponse>(`/clients/${clientId}/add-comment`, {
      method: "PUT",
      body: JSON.stringify(commentData),
    });
    return response;
  },

  getClientPointsHistory: async (
    clientId: string,
    filters: ClientPointsHistoryFilters = {}
  ): Promise<GetClientPointsHistoryResponse> => {
    const { page = 1, limit = 50, type, branchId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) searchParams.append("type", type);
    if (branchId) searchParams.append("branchId", branchId);

    const response = await apiCall<GetClientPointsHistoryResponse>(
      `/clients/${clientId}/points-history?${searchParams}`
    );
    return response;
  },

  redeemReward: async (
    clientId: string,
    data: RedeemRewardData
  ): Promise<RedeemRewardResponse> => {
    const response = await apiCall<RedeemRewardResponse>(
      `/clients/${clientId}/redeem-reward`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response;
  },

  verifyRewardCode: async (
    clientId: string,
    data: VerifyRewardCodeData
  ): Promise<VerifyRewardCodeResponse> => {
    const response = await apiCall<VerifyRewardCodeResponse>(
      `/clients/${clientId}/verify-reward-code`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as unknown as VerifyRewardCodeResponse;
  },

  getAvailableRewards: async (
    clientId: string
  ): Promise<GetAvailableRewardsResponse> => {
    const response = await apiCall<GetAvailableRewardsResponse>(
      `/clients/${clientId}/available-rewards`
    );
    return response as unknown as GetAvailableRewardsResponse;
  },
};