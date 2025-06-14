import { apiCall } from "@/utils/api";

export interface RazonSocial {
  _id: string;
  nombreComercial: string;
  razonSocial: string;
  direccion: string;
  estatus: boolean;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetRazonesSocialesResponse {
  success: boolean;
  data: RazonSocial[];
  pagination: PaginationInfo;
}

export const razonesSocialesService = {
  getAll: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      estatus?: string;
    } = {}
  ) => {
    const { page = 1, limit = 10, search, estatus } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(estatus && { estatus }),
    });
    return await apiCall<GetRazonesSocialesResponse>(
      `/razones-sociales?${searchParams}`
    );
  },
  create: async (data: Omit<RazonSocial, "_id" | "createdAt">) => {
    return await apiCall<{ success: boolean; data: RazonSocial }>(
      "/razones-sociales",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
  update: async (id: string, data: Omit<RazonSocial, "_id" | "createdAt">) => {
    return await apiCall<{ success: boolean; data: RazonSocial }>(
      `/razones-sociales/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },
  delete: async (id: string) => {
    return await apiCall<{ success: boolean }>(`/razones-sociales/${id}`, {
      method: "DELETE",
    });
  },
};
