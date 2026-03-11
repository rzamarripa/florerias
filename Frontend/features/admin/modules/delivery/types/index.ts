export interface Delivery {
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

export interface CreateDeliveryData {
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

export interface UpdateDeliveryData {
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

export interface CreateDeliveryResponseData {
  success: boolean;
  data: Delivery;
  message: string;
}

export interface GetDeliveryResponse {
  success: boolean;
  data: Delivery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeliveryFilters {
  page?: number;
  limit?: number;
  search?: string;
  estatus?: boolean;
}
