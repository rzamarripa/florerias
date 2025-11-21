import { apiCall } from "@/utils/api";
import { ProductCategory, CreateProductCategoryData, UpdateProductCategoryData } from "../types";

export interface ProductCategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface GetProductCategoriesResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: ProductCategory[];
}

export const productCategoriesService = {
  getAllProductCategories: async (filters: ProductCategoryFilters = {}): Promise<GetProductCategoriesResponse> => {
    const { page = 1, limit = 10, search, isActive } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());

    const response = await apiCall<GetProductCategoriesResponse>(`/product-categories?${searchParams}`);
    return response;
  },

  getProductCategoryById: async (categoryId: string): Promise<{ success: boolean; data: ProductCategory }> => {
    const response = await apiCall<{ success: boolean; data: ProductCategory }>(`/product-categories/${categoryId}`);
    return response;
  },

  createProductCategory: async (categoryData: CreateProductCategoryData): Promise<{ success: boolean; data: ProductCategory; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ProductCategory; message: string }>("/product-categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
    return response;
  },

  updateProductCategory: async (
    categoryId: string,
    categoryData: UpdateProductCategoryData
  ): Promise<{ success: boolean; data: ProductCategory; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ProductCategory; message: string }>(`/product-categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
    return response;
  },

  activateProductCategory: async (categoryId: string): Promise<{ success: boolean; data: ProductCategory; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ProductCategory; message: string }>(`/product-categories/${categoryId}/activate`, {
      method: "PATCH",
    });
    return response;
  },

  deactivateProductCategory: async (categoryId: string): Promise<{ success: boolean; data: ProductCategory; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ProductCategory; message: string }>(`/product-categories/${categoryId}/deactivate`, {
      method: "PATCH",
    });
    return response;
  },

  deleteProductCategory: async (categoryId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/product-categories/${categoryId}`, {
      method: "DELETE",
    });
    return response;
  },
};
