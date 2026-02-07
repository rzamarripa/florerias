import { apiCall } from "@/utils/api";
import {
  ProductionUser,
  ProductionUserFilters,
  GetProductionUsersResponse,
  UpdateProductionUserData,
} from "../types";

export const productionUsersService = {
  getAllProductionUsers: async (filters: ProductionUserFilters = {}): Promise<GetProductionUsersResponse> => {
    const { page = 1, limit = 10, search, estatus, branchId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<ProductionUser[]>(`/production-users?${searchParams}`);
    return response as any;
  },

  getProductionUserById: async (userId: string): Promise<{ success: boolean; data: ProductionUser }> => {
    const response = await apiCall<ProductionUser>(`/production-users/${userId}`);
    return response as any;
  },

  updateProductionUser: async (
    userId: string,
    userData: UpdateProductionUserData
  ): Promise<{ success: boolean; data: ProductionUser; message: string }> => {
    const response = await apiCall<ProductionUser>(`/production-users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return response as any;
  },

  deleteProductionUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<null>(`/production-users/${userId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  activateProductionUser: async (userId: string): Promise<{ success: boolean; data: ProductionUser; message: string }> => {
    const response = await apiCall<ProductionUser>(`/production-users/${userId}/activate`, {
      method: "PUT",
    });
    return response as any;
  },

  deactivateProductionUser: async (userId: string): Promise<{ success: boolean; data: ProductionUser; message: string }> => {
    const response = await apiCall<ProductionUser>(`/production-users/${userId}/deactivate`, {
      method: "PUT",
    });
    return response as any;
  },
};