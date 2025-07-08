export interface Route {
  _id: string;
  name: string;
  description?: string;
  categoryId?: {
    _id: string;
    name: string;
    description?: string;
  };
  brandId: {
    _id: string;
    name: string;
    description?: string;
  };
  companyId: {
    _id: string;
    name: string;
    legalRepresentative: string;
  };
  branchId: {
    _id: string;
    name: string;
    address: string;
  };
  status: boolean;
  createdAt: string;
}

export interface RouteFormData {
  name: string;
  description?: string;
  categoryId: string;
  brandId: string;
  companyId: string;
  branchId: string;
  status?: boolean;
} 