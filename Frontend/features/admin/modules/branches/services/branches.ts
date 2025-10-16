import { apiCall } from "@/utils/api";
import { Branch, CreateBranchData, Employee } from "../types";

export interface BranchFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  companyId?: string;
}

export interface GetBranchesResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Branch[];
}

export const branchesService = {
  getAllBranches: async (filters: BranchFilters = {}): Promise<GetBranchesResponse> => {
    const { page = 1, limit = 10, search, isActive, companyId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());
    if (companyId) searchParams.append('companyId', companyId);

    const response = await apiCall<GetBranchesResponse>(`/branches?${searchParams}`);
    return response;
  },

  getBranchById: async (branchId: string): Promise<{ success: boolean; data: Branch }> => {
    const response = await apiCall<{ success: boolean; data: Branch }>(`/branches/${branchId}`);
    return response;
  },

  createBranch: async (branchData: CreateBranchData): Promise<{ success: boolean; data: Branch; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Branch; message: string }>("/branches", {
      method: "POST",
      body: JSON.stringify(branchData),
    });
    return response;
  },

  updateBranch: async (
    branchId: string,
    branchData: Partial<CreateBranchData>
  ): Promise<{ success: boolean; data: Branch; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Branch; message: string }>(`/branches/${branchId}`, {
      method: "PUT",
      body: JSON.stringify(branchData),
    });
    return response;
  },

  activateBranch: async (branchId: string): Promise<{ success: boolean; data: Branch; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Branch; message: string }>(`/branches/${branchId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateBranch: async (branchId: string): Promise<{ success: boolean; data: Branch; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Branch; message: string }>(`/branches/${branchId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },

  deleteBranch: async (branchId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/branches/${branchId}`, {
      method: "DELETE",
    });
    return response;
  },

  addEmployees: async (
    branchId: string,
    employeeIds: string[]
  ): Promise<{ success: boolean; data: Branch; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Branch; message: string }>(
      `/branches/${branchId}/employees`,
      {
        method: "POST",
        body: JSON.stringify({ employeeIds }),
      }
    );
    return response;
  },

  removeEmployee: async (
    branchId: string,
    employeeId: string
  ): Promise<{ success: boolean; data: Branch; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Branch; message: string }>(
      `/branches/${branchId}/employees/${employeeId}`,
      {
        method: "DELETE",
      }
    );
    return response;
  },

  getAvailableEmployees: async (): Promise<{ success: boolean; data: Employee[] }> => {
    const response = await apiCall<{ success: boolean; data: Employee[] }>("/users?excludeRoles=Administrador,Super Admin,Distribuidor");
    return response;
  },

  getAvailableManagers: async (): Promise<{ success: boolean; data: Employee[]; message?: string }> => {
    const response = await apiCall<{ success: boolean; data: Employee[]; message?: string }>("/branches/available-managers");
    return response;
  },
};
