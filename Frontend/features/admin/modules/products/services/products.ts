import { apiCall } from "@/utils/api";
import {
  Product,
  ProductFilters,
  CreateProductData,
  CreateProductResponseData,
  GetProductsResponse,
  UpdateProductData,
} from "../types";

export const productsService = {
  getAllProducts: async (filters: ProductFilters = {}): Promise<GetProductsResponse> => {
    const { page = 1, limit = 10, nombre, unidad, estatus } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (nombre) searchParams.append('nombre', nombre);
    if (unidad) searchParams.append('unidad', unidad);
    if (estatus !== undefined) searchParams.append('estatus', estatus.toString());

    const response = await apiCall<GetProductsResponse>(`/products?${searchParams}`);
    return response;
  },

  getProductById: async (productId: string): Promise<{ success: boolean; data: Product }> => {
    const response = await apiCall<{ success: boolean; data: Product }>(`/products/${productId}`);
    return response;
  },

  createProduct: async (productData: CreateProductData): Promise<CreateProductResponseData> => {
    const response = await apiCall<CreateProductResponseData>("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
    return response;
  },

  updateProduct: async (
    productId: string,
    productData: UpdateProductData
  ): Promise<CreateProductResponseData> => {
    const response = await apiCall<CreateProductResponseData>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
    return response;
  },

  deleteProduct: async (productId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/products/${productId}`, {
      method: "DELETE",
    });
    return response;
  },

  activateProduct: async (productId: string): Promise<CreateProductResponseData> => {
    const response = await apiCall<CreateProductResponseData>(`/products/${productId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateProduct: async (productId: string): Promise<CreateProductResponseData> => {
    const response = await apiCall<CreateProductResponseData>(`/products/${productId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },

  getProductStats: async (productId: string): Promise<{ success: boolean; data: { orderCount: number; totalQuantitySold: number; totalRevenue: number } }> => {
    const response = await apiCall<{ success: boolean; data: { orderCount: number; totalQuantitySold: number; totalRevenue: number } }>(`/products/${productId}/stats`);
    return response;
  },
};
