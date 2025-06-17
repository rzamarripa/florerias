import { apiCall } from "@/utils/api";
import { Category } from "../types";

export const categoryService = {
  getAll: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, search } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return await apiCall<Category[]>(`/categories?${searchParams}`);
  },
};
