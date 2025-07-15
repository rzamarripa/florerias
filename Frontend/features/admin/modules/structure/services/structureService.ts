import { apiCall } from "@/utils/api";
import { 
  StructureTreeNode, 
  CreateBrandData, 
  CreateBranchData, 
  CreateRouteData
} from "../types";

export const structureService = {
  getStructureTree: async (userId?: string): Promise<StructureTreeNode[]> => {
    const params = userId ? `?userId=${userId}` : "";
    const response = await apiCall<StructureTreeNode[]>(`/structure/tree${params}`);
    return response.data || [];
  },

  createBrand: async (data: CreateBrandData): Promise<any> => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.categoryId);
    formData.append("description", data.description || "");
    formData.append("rsCompanies", JSON.stringify([data.companyId]));

    const response = await fetch("/api/brands", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return response.json();
  },

  createBranch: async (data: CreateBranchData): Promise<any> => {
    const payload = {
      companyId: data.companyId,
      name: data.name,
      countryId: data.countryId,
      stateId: data.stateId,
      municipalityId: data.municipalityId,
      address: data.address,
      phone: data.phone,
      email: data.email,
      description: data.description || "",
      rsBrands: [data.brandId],
    };

    return await apiCall("/branches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  createRoute: async (data: CreateRouteData): Promise<any> => {
    const payload = {
      name: data.name,
      categoryId: data.categoryId,
      companyId: data.companyId,
      brandId: data.brandId,
      branchId: data.branchId,
      description: data.description || "",
      status: true,
    };

    return await apiCall("/routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  getDefaultCountry: async (): Promise<any> => {
    const response = await apiCall<any[]>("/countries");
    const countries = response.data || [];
    return countries.find(c => c.name === "México") || countries[0];
  },

  getStatesByCountry: async (countryId: string): Promise<any[]> => {
    const response = await apiCall<any[]>(`/states/country/${countryId}`);
    return response.data || [];
  },

  getMunicipalitiesByState: async (stateId: string): Promise<any[]> => {
    const response = await apiCall<any[]>(`/municipalities/state/${stateId}`);
    return response.data || [];
  },
}; 