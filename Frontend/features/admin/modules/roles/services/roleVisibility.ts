import { apiCall } from "@/utils/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UserVisibilityUpdatePayload {
  companies: string[];
  brands: string[];
  branches: string[];
}

export interface VisibilityStructure {
  companies: Record<string, any>;
  selectedCompanies: string[];
  selectedBrands: string[];
  selectedBranches: string[];
}

export const userVisibilityService = {
  getStructure: (userId: string): Promise<ApiResponse<VisibilityStructure>> => {
    return apiCall(`/role-visibility/${userId}/structure`);
  },

  getAllStructure: (): Promise<ApiResponse<VisibilityStructure>> => {
    return apiCall("/role-visibility/structure");
  },

  update: (
    userId: string,
    data: UserVisibilityUpdatePayload
  ): Promise<ApiResponse<any>> => {
    return apiCall(`/role-visibility/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  checkAccess: (
    userId: string,
    params: { companyId?: string; brandId?: string; branchId?: string }
  ): Promise<ApiResponse<boolean>> => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.append("companyId", params.companyId);
    if (params.brandId) queryParams.append("brandId", params.brandId);
    if (params.branchId) queryParams.append("branchId", params.branchId);

    return apiCall(
      `/role-visibility/${userId}/check-access?${queryParams.toString()}`
    );
  },
};
