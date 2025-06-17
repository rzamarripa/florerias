import { apiCall } from "@/utils/api";
import { Brand, Company } from "../types";

export interface CreateBrandData {
  name: string;
  category?: string;
  description?: string;
  rsCompanies?: string[];
  logo?: File;
}

export interface UpdateBrandData {
  name?: string;
  category?: string;
  description?: string;
  rsCompanies?: string[];
  logo?: File;
}

export const brandsService = {
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
    return await apiCall<Brand[]>(`/brands?${searchParams}`);
  },

  getAllCompanies: async () => {
    return apiCall<Company[]>("/companies/all");
  },

  create: async (data: CreateBrandData) => {
    const formData = new FormData();

    formData.append("name", data.name);
    if (data.category) formData.append("category", data.category);

    if (data.description) formData.append("description", data.description);

    if (data.rsCompanies && data.rsCompanies.length > 0) {
      formData.append("rsCompanies", JSON.stringify(data.rsCompanies));
    }

    if (data.logo) {
      formData.append("logo", data.logo);
    }

    return await apiCall<{ success: boolean; data: Brand; message: string }>(
      "/brands",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  update: async (id: string, data: UpdateBrandData) => {
    const formData = new FormData();

    if (data.name) formData.append("name", data.name);
    if (data.category) formData.append("category", data.category);
    if (data.description) formData.append("description", data.description);

    if (data.rsCompanies !== undefined) {
      formData.append("rsCompanies", JSON.stringify(data.rsCompanies));
    }

    if (data.logo) {
      formData.append("logo", data.logo);
    }

    return await apiCall<{ success: boolean; data: Brand; message: string }>(
      `/brands/${id}`,
      {
        method: "PUT",
        body: formData,
      }
    );
  },

  activate: async (id: string) => {
    return await apiCall<{ success: boolean; message: string }>(
      `/brands/${id}/active`,
      {
        method: "PUT",
      }
    );
  },

  delete: async (id: string) => {
    return await apiCall<{ success: boolean; message: string }>(
      `/brands/${id}/delete`,
      {
        method: "DELETE",
      }
    );
  },
};
