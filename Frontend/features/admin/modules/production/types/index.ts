export interface Production {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
    estatus: boolean;
  };
  role: {
    _id: string;
    name: string;
    description?: string;
  };
  branch: {
    _id: string;
    branchName: string;
    branchCode: string;
    companyId: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductionData {
  username: string;
  email: string;
  phone: string;
  password: string;
  profile: {
    name: string;
    lastName: string;
  };
  branch: string;
}

export interface UpdateProductionData {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  profile?: {
    name?: string;
    lastName?: string;
  };
  estatus?: boolean;
}

export interface CreateProductionResponseData {
  success: boolean;
  data: Production;
  message: string;
}

export interface GetProductionResponse {
  success: boolean;
  data: Production[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductionFilters {
  page?: number;
  limit?: number;
  search?: string;
  estatus?: boolean;
}
