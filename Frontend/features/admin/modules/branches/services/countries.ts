import { apiCall } from "@/utils/api";

export interface Country {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export const countriesService = {
  getAll: async () => {
    return await apiCall<Country[]>("/countries?isActive=true");
  },
};
