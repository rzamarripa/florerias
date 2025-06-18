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
  getAll: async () => {
    return await apiCall<Brand[]>("/brands?isActive=true");
  },
};
