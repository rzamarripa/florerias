import { apiCall } from "@/utils/api";
import {
  Storage,
  CreateStorageData,
  UpdateStorageData,
  AddProductsData,
  RemoveProductsData,
  UpdateProductQuantityData,
} from "../types";

export interface StorageFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  branch?: string;
}

export interface GetStoragesResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Storage[];
}

export const storageService = {
  getAllStorages: async (filters: StorageFilters = {}): Promise<GetStoragesResponse> => {
    const { page = 1, limit = 10, search, isActive, branch } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append("search", search);
    if (isActive !== undefined) searchParams.append("isActive", isActive.toString());
    if (branch) searchParams.append("branch", branch);

    const response = await apiCall<GetStoragesResponse>(`/storages?${searchParams}`);
    return response as any;
  },

  getStorageById: async (storageId: string): Promise<{ success: boolean; data: Storage }> => {
    const response = await apiCall<{ success: boolean; data: Storage }>(`/storages/${storageId}`);
    return response as any;
  },

  getStorageByBranch: async (branchId: string): Promise<{ success: boolean; data: Storage }> => {
    const response = await apiCall<{ success: boolean; data: Storage }>(`/storages/branch/${branchId}`);
    return response as any;
  },

  createStorage: async (
    storageData: CreateStorageData
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>("/storages", {
      method: "POST",
      body: JSON.stringify(storageData),
    });
    return response as any;
  },

  updateStorage: async (
    storageId: string,
    storageData: UpdateStorageData
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}`,
      {
        method: "PUT",
        body: JSON.stringify(storageData),
      }
    );
    return response as any;
  },

  addProductsToStorage: async (
    storageId: string,
    data: AddProductsData
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}/add-products`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },

  removeProductsFromStorage: async (
    storageId: string,
    data: RemoveProductsData
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}/remove-products`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },

  updateProductQuantity: async (
    storageId: string,
    data: UpdateProductQuantityData
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}/update-quantity`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },

  activateStorage: async (storageId: string): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}/activate`,
      {
        method: "PUT",
      }
    );
    return response as any;
  },

  deactivateStorage: async (
    storageId: string
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}/deactivate`,
      {
        method: "PUT",
      }
    );
    return response as any;
  },

  deleteStorage: async (storageId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/storages/${storageId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  reserveStock: async (
    storageId: string,
    data: { productId: string; quantity: number }
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}/reserve-stock`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },

  releaseStock: async (
    storageId: string,
    data: { productId: string; quantity: number }
  ): Promise<{ success: boolean; data: Storage; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Storage; message: string }>(
      `/storages/${storageId}/release-stock`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response as any;
  },
};
