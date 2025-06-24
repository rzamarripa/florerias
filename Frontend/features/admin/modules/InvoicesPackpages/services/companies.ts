import { apiCall } from "@/utils/api";
import { Company, GetCompaniesResponse } from "../types";

export const companiesService = {
  getAllCompanies: async (): Promise<GetCompaniesResponse> => {
    const response = await apiCall<Company[]>("/companies/all");
    return response;
  },
}; 