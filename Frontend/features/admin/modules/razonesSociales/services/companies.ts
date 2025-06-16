import { apiCall } from "@/utils/api";

export interface Company {
  _id: string;
  tradeName: string;
  legalName: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetCompaniesResponse {
  success: boolean;
  data: Company[];
  pagination: PaginationInfo;
}

export const companiesService = {
  getAll: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, search, isActive } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(isActive && { isActive }),
    });
    return await apiCall<GetCompaniesResponse>(
      `/companies?${searchParams}`
    );
  },
  create: async (data: Omit<Company, "_id" | "createdAt">) => {
    return await apiCall<{ success: boolean; data: Company }>(
      "/companies",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
  update: async (id: string, data: Omit<Company, "_id" | "createdAt">) => {
    return await apiCall<{ success: boolean; data: Company }>(
      `/companies/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },
  activate: async (id: string) => {
    return await apiCall<{ success: boolean; data: Company }>(
      `/companies/${id}/active`,
      {
        method: "PUT",
      }
    );
  },
  delete: async (id: string) => {
    return await apiCall<{ success: boolean }>(`/companies/${id}/delete`, {
      method: "DELETE",
    });
  },
};