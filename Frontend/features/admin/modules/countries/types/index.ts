export interface Country {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CountrySearchParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
}
