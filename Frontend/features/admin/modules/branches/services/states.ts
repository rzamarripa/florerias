import { apiCall } from "@/utils/api";

const API_BASE = "/branches";

export interface State {
  _id: string;
  name: string;
  countryId: string;
  isActive: boolean;
  createdAt: string;
}

export const statesService = {
  getByCountry: async (countryId: string) => {
    return await apiCall<State[]>(`${API_BASE}/states/by-country/${countryId}`);
  },
};
