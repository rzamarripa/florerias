export interface NetworksUser {
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

export interface CreateNetworksUserData {
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

export interface UpdateNetworksUserData {
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

export interface CreateNetworksUserResponseData {
  success: boolean;
  data: NetworksUser;
  message: string;
}

export interface GetNetworksUsersResponse {
  success: boolean;
  data: NetworksUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NetworksUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  estatus?: boolean;
  branchId?: string;
}