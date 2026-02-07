export interface DeliveryDriver {
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

export interface CreateDeliveryDriverData {
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

export interface UpdateDeliveryDriverData {
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

export interface CreateDeliveryDriverResponseData {
  success: boolean;
  data: DeliveryDriver;
  message: string;
}

export interface GetDeliveryDriversResponse {
  success: boolean;
  data: DeliveryDriver[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeliveryDriverFilters {
  page?: number;
  limit?: number;
  search?: string;
  estatus?: boolean;
  branchId?: string;
}