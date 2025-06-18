import { apiCall } from "@/utils/api";

export interface State {
  _id: string;
  name: string;
  countryId: string;
  isActive: boolean;
  createdAt: string;
}

export const statesService = {
  getByCountry: async (countryId: string) => {
    return await apiCall<State[]>(`/states/country/${countryId}`);
  },
};
