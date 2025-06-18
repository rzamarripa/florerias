import { apiCall } from "@/utils/api";

export interface Company {
  _id: string;
  name: string;
  legalRepresentative: string;
  rfc: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export const companiesService = {
  getAll: async () => {
    return await apiCall<Company[]>("/companies?isActive=true");
  },
};
