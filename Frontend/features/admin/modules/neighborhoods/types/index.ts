export interface Neighborhood {
  _id: string;
  name: string;
  priceDelivery: number;
  status: "active" | "inactive";
  branch?: {
    _id: string;
    branchName: string;
    branchCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateNeighborhoodData {
  name: string;
  priceDelivery: number;
  status?: "active" | "inactive";
  branchId: string;
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
  branchId?: string;
}
