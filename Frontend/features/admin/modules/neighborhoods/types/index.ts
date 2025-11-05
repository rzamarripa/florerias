export interface Neighborhood {
  _id: string;
  name: string;
  priceDelivery: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateNeighborhoodData {
  name: string;
  priceDelivery: number;
  status?: "active" | "inactive";
}

export interface UpdateNeighborhoodData {
  name?: string;
  priceDelivery?: number;
  status?: "active" | "inactive";
}

export interface GetNeighborhoodsResponse {
  success: boolean;
  data: Neighborhood[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NeighborhoodFilters {
  page?: number;
  limit?: number;
  status?: "active" | "inactive";
  search?: string;
}
