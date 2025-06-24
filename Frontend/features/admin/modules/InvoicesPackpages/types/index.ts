export interface UserProvider {
  _id: string;
  userId: string;
  providerId: {
    _id: string;
    commercialName: string;
    businessName: string;
    contactName: string;
    isActive: boolean;
  };
  createdAt: string;
}

export interface GetUserProvidersResponse {
  success: boolean;
  data: UserProvider[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Company {
  _id: string;
  name: string;
  legalRepresentative: string;
  rfc: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  _id: string;
  name: string;
  companyId: {
    _id: string;
    name: string;
  };
  address: string;
  phone: string;
  email: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GetCompaniesResponse {
  success: boolean;
  data: Company[];
}

export interface GetBrandsByCompanyResponse {
  success: boolean;
  data: Brand[];
}

export interface GetBranchesByBrandResponse {
  success: boolean;
  data: Branch[];
} 