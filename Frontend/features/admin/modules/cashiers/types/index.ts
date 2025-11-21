export interface Cashier {
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

export interface CreateCashierData {
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

export interface UpdateCashierData {
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

export interface CreateCashierResponseData {
  success: boolean;
  data: Cashier;
  message: string;
}

export interface GetCashiersResponse {
  success: boolean;
  data: Cashier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CashierFilters {
  page?: number;
  limit?: number;
  search?: string;
  estatus?: boolean;
  branchId?: string;
}