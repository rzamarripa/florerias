import { apiCall } from "@/utils/api";

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  companies?: string[];
}

export const brandsService = {
  getAllForSelects: async () => {
    return await apiCall<Brand[]>("/brands/all");
  },

  getByCompany: async (companyId: string) => {
    return await apiCall<Brand[]>(`/brands/by-company/${companyId}`);
  },

  getAll: async (params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}) => {
    const { page = 1, limit = 10, isActive } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(isActive !== undefined && { isActive: isActive.toString() }),
    });
    return await apiCall<Brand[]>(`/brands?${searchParams}`);
  },
};
