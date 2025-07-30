import { apiCall } from "@/utils/api";
import { GetCompaniesResponse } from "../types";

export const companiesService = {
  getAllCompanies: async (): Promise<GetCompaniesResponse> => {
    const response = await apiCall<GetCompaniesResponse["data"]>(
      "/companies?limit=100"
    );
    return response;
  },
};
