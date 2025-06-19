import { apiCall } from "@/utils/api";

const API_BASE = "/branches";

export interface Municipality {
  _id: string;
  name: string;
  stateId: string;
  isActive: boolean;
  createdAt: string;
}

export const municipalitiesService = {
  getByState: async (stateId: string) => {
    return await apiCall<Municipality[]>(`${API_BASE}/municipalities/by-state/${stateId}`);
  },
};
