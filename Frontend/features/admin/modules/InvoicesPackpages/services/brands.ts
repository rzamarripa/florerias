import { apiCall } from "@/utils/api";
import { Brand, GetBrandsByCompanyResponse } from "../types";

export const brandsService = {
  getBrandsByCompany: async (companyId: string): Promise<GetBrandsByCompanyResponse> => {
    const response = await apiCall<Brand[]>(`/brands/by-company/${companyId}`);
    return response;
  },
}; 