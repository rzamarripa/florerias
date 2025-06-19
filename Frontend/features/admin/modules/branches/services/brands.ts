import { apiCall } from "@/utils/api";

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  companies?: string[];
}

export const brandsService = {
  getAllForSelects: async () => {
    return await apiCall<Brand[]>("/brands/all");
  },

  getByCompany: async (companyId: string) => {
    return await apiCall<Brand[]>(`/brands/by-company/${companyId}`);
  },
};
