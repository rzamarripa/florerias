export interface SalesChannel {
  _id: string;
  name: string;
  abbreviation: string;
  status: "active" | "inactive";
  companyId: {
    _id: string;
    legalName: string;
    tradeName?: string;
  } | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesChannelData {
  name: string;
  abbreviation: string;
  status?: "active" | "inactive";
  companyId?: string; // Solo para Super Admin
}

export interface UpdateSalesChannelData {
  name?: string;
  abbreviation?: string;
  status?: "active" | "inactive";
}

export interface GetSalesChannelsResponse {
  success: boolean;
  data: SalesChannel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SalesChannelFilters {
  page?: number;
  limit?: number;
  status?: "active" | "inactive";
  search?: string;
  companyId?: string;
}