import { apiCall } from "@/utils/api";
import {
  ProductListFilters,
  CreateProductListData,
  UpdateProductListData,
  GetProductListsResponse,
  GetProductListByIdResponse,
  CreateProductListResponse,
  UpdateProductListResponse,
  GetProductListByBranchResponse,
} from "../types";

export const productListsService = {
  getAllProductLists: async (filters: ProductListFilters = {}): Promise<GetProductListsResponse> => {
    const { page = 1, limit = 10, name, companyId, status } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (name) searchParams.append('name', name);
    if (companyId) searchParams.append('companyId', companyId);
    if (status !== undefined) searchParams.append('status', status.toString());

    const response = await apiCall<GetProductListsResponse>(`/product-lists?${searchParams}`);
    return response;
  },

  getProductListById: async (productListId: string): Promise<GetProductListByIdResponse> => {
    const response = await apiCall<GetProductListByIdResponse>(`/product-lists/${productListId}`);
    return response;
  },

  createProductList: async (productListData: CreateProductListData): Promise<CreateProductListResponse> => {
    const response = await apiCall<CreateProductListResponse>("/product-lists", {
      method: "POST",
      body: JSON.stringify(productListData),
    });
    return response;
  },

  updateProductList: async (
    productListId: string,
    productListData: UpdateProductListData
  ): Promise<UpdateProductListResponse> => {
    const response = await apiCall<UpdateProductListResponse>(`/product-lists/${productListId}`, {
      method: "PUT",
      body: JSON.stringify(productListData),
    });
    return response;
  },

  updateProductListStatus: async (
    productListId: string,
    status: boolean
  ): Promise<UpdateProductListResponse> => {
    const response = await apiCall<UpdateProductListResponse>(`/product-lists/${productListId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    return response;
  },

  deleteProductList: async (productListId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/product-lists/${productListId}`, {
      method: "DELETE",
    });
    return response;
  },

  getProductListByBranch: async (branchId: string): Promise<GetProductListByBranchResponse> => {
    const response = await apiCall<GetProductListByBranchResponse>(`/product-lists/by-branch/${branchId}`);
    return response as any;
  },
};
