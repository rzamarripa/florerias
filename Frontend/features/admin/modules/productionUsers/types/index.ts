export interface ProductionUser {
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

export interface UpdateProductionUserData {
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

export interface GetProductionUsersResponse {
  success: boolean;
  data: ProductionUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductionUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  estatus?: boolean;
  branchId?: string;
}