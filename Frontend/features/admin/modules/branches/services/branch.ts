import { apiCall } from "@/utils/api";
import { Branch, CreateBranchRequest, UpdateBranchRequest } from "../types";

export const branchService = {
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
    return await apiCall<Branch[]>(`/branches?${searchParams}`);
  },

  create: async (data: CreateBranchRequest) => {
    return await apiCall<Branch>(`/branches`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
  },

  update: async (id: string, data: UpdateBranchRequest) => {
    return await apiCall<Branch>(`/branches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
  },

  activate: async (id: string) => {
    return await apiCall<null>(`/branches/${id}/active`, {
      method: "PUT",
    });
  },

  delete: async (id: string) => {
    return await apiCall<null>(`/branches/${id}`, {
      method: "DELETE",
    });
  },
};
