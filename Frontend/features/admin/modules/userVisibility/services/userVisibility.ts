import { apiCall } from "@/utils/api";

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
  getStructure: (userId: string) => {
    return apiCall<VisibilityStructure>(`/role-visibility/${userId}/structure`);
  },

  getAllStructure: () => {
    return apiCall<VisibilityStructure>("/role-visibility/structure");
  },

  update: (userId: string, data: UserVisibilityUpdatePayload) => {
    return apiCall<any>(`/role-visibility/${userId}`, {
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
  ) => {
    const queryParams = new URLSearchParams();
    if (params.companyId) queryParams.append("companyId", params.companyId);
    if (params.brandId) queryParams.append("brandId", params.brandId);
    if (params.branchId) queryParams.append("branchId", params.branchId);

    return apiCall<boolean>(
      `/role-visibility/${userId}/check-access?${queryParams.toString()}`
    );
  },
};
