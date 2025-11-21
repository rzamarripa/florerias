import { apiCall } from "@/utils/api";
import { Company, CreateCompanyData, Distributor, RedesUser } from "../types";

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface GetCompaniesResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Company[];
}

export const companiesService = {
  getAllCompanies: async (filters: CompanyFilters = {}): Promise<GetCompaniesResponse> => {
    const { page = 1, limit = 10, search, isActive } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());

    const response = await apiCall<GetCompaniesResponse>(`/companies?${searchParams}`);
    return response;
  },

  getCompanyById: async (companyId: string): Promise<{ success: boolean; data: Company }> => {
    const response = await apiCall<{ success: boolean; data: Company }>(`/companies/${companyId}`);
    return response;
  },

  createCompany: async (companyData: CreateCompanyData): Promise<{ success: boolean; data: Company; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Company; message: string }>("/companies", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
    return response;
  },

  updateCompany: async (
    companyId: string,
    companyData: CreateCompanyData
  ): Promise<{ success: boolean; data: Company; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Company; message: string }>(`/companies/${companyId}`, {
      method: "PUT",
      body: JSON.stringify(companyData),
    });
    return response;
  },

  activateCompany: async (companyId: string): Promise<{ success: boolean; data: Company; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Company; message: string }>(`/companies/${companyId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateCompany: async (companyId: string): Promise<{ success: boolean; data: Company; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Company; message: string }>(`/companies/${companyId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },

  deleteCompany: async (companyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/companies/${companyId}`, {
      method: "DELETE",
    });
    return response;
  },

  getAdministrators: async (): Promise<{ success: boolean; count: number; data: Distributor[] }> => {
    const response = await apiCall<{ success: boolean; count: number; data: Distributor[] }>("/companies/administrators/list");
    return response;
  },

  getRedesUsers: async (): Promise<{ success: boolean; count: number; data: RedesUser[] }> => {
    const response = await apiCall<{ success: boolean; count: number; data: RedesUser[] }>("/companies/redes/list");
    return response;
  },

  getAllBranches: async (filters: { isActive?: boolean } = {}): Promise<{ success: boolean; data: any[] }> => {
    const searchParams = new URLSearchParams();
    if (filters.isActive !== undefined) {
      searchParams.append('isActive', filters.isActive.toString());
    }
    const response = await apiCall<{ success: boolean; data: any[] }>(`/branches?${searchParams}`);
    return response;
  },

  updateCompanyBranches: async (
    companyId: string,
    branchIds: string[]
  ): Promise<{ success: boolean; data: Company; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Company; message: string }>(
      `/companies/${companyId}/branches`,
      {
        method: "PUT",
        body: JSON.stringify({ branchIds }),
      }
    );
    return response;
  },

  getMyCompany: async (): Promise<Company> => {
    const response = await apiCall<Company>("/companies/my-company");
    return response.data;
  },

  getUserCompany: async (): Promise<{ success: boolean; data: { _id: string; legalName: string; tradeName?: string; rfc: string } }> => {
    const response = await apiCall<{ success: boolean; data: { _id: string; legalName: string; tradeName?: string; rfc: string } }>("/companies/user-company");
    return response;
  },

  getCompanyByBranchId: async (branchId: string) => {
    const response = await apiCall<{
      success: boolean;
      data: {
        companyName: string;
        rfc: string;
        address: {
          street: string;
          externalNumber: string;
          internalNumber?: string;
          neighborhood: string;
          city: string;
          state: string;
          postalCode: string;
        };
        phone: string;
        email: string;
        branchName: string;
      }
    }>(`/companies/branch/${branchId}`);
    return response as any;
  },

  getRedesUserBranches: async (): Promise<{ success: boolean; count: number; data: any[] }> => {
    const response = await apiCall<{ success: boolean; count: number; data: any[] }>("/companies/redes/branches");
    return response;
  },
};
