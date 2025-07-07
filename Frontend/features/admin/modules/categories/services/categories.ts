import { apiCall } from "@/utils/api";
import {
  Category,
  CategoryFormData
} from "../types/index";

export interface CategorySearchParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
}

export const categoryService = {
  getActive: async () => {
    return await apiCall<{ success: boolean; data: Pick<Category, '_id' | 'name'>[] }>(
      "/categories"
    );
  },

  getAll: async (params: CategorySearchParams = {}) => {
    const { page = 1, limit = 10, search, isActive } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(isActive && { isActive }),
    });
    return await apiCall<Category[]>(
      `/categories?${searchParams}`
    );
  },

  create: async (data: CategoryFormData) => {
    return await apiCall<Category[]>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: CategoryFormData) => {
    return await apiCall<Category[]>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  activate: async (id: string) => {
    return await apiCall<Category[]>(`/categories/${id}/active`, {
      method: "PUT",
    });
  },

  delete: async (id: string) => {
    return await apiCall<Category[]>(`/categories/${id}`, {
      method: "DELETE",
    });
  },

  toggleStatus: async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      return await categoryService.delete(id);
    } else {
      return await categoryService.activate(id);
    }
  },

  toggleHasRoutes: async (id: string, hasRoutes: boolean) => {
    return await apiCall<Category[]>(`/categories/${id}/hasRoutes`, {
      method: "PATCH",
      body: JSON.stringify({ hasRoutes }),
    });
  },
};

export const {
  getActive: getCategoriesActive,
  getAll: getCategories,
  create: createCategory,
  update: updateCategory,
  activate: activateCategory,
  delete: deleteCategory,
  toggleStatus: toggleCategoryStatus,
  toggleHasRoutes: toggleCategoryHasRoutes,
} = categoryService;