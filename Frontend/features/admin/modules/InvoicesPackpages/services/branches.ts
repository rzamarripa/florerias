import { apiCall } from "@/utils/api";
import { Branch, GetBranchesByBrandResponse } from "../types";

export const branchesService = {
  getBranchesByBrand: async (brandId: string): Promise<GetBranchesByBrandResponse> => {
    const response = await apiCall<Branch[]>(`/branches/by-brand/${brandId}`);
    return response;
  },
}; 