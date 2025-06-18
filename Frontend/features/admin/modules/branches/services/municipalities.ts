import { apiCall } from "@/utils/api";

export interface Municipality {
  _id: string;
  name: string;
  stateId: string;
  isActive: boolean;
  createdAt: string;
}

export const municipalitiesService = {
  getByState: async (stateId: string) => {
    return await apiCall<Municipality[]>(`/municipalities/state/${stateId}`);
  },
};
