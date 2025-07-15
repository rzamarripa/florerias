export interface StructureTreeNode {
  id: string;
  text: string;
  type: "category" | "company" | "brand" | "branch" | "route";
  hasRoutes?: boolean;
  children?: StructureTreeNode[];
  canAdd?: boolean;
  addType?: "brand" | "branch" | "route";
  entityData: {
    _id: string;
    name: string;
    description?: string;
    hasRoutes?: boolean;
    categoryId?: string;
    companyId?: string;
    brandId?: string;
    branchId?: string;
  };
}

export interface CreateBrandData {
  name: string;
  categoryId: string;
  companyId: string;
  description?: string;
}

export interface CreateBranchData {
  name: string;
  companyId: string;
  brandId: string;
  countryId: string;
  stateId: string;
  municipalityId: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
}

export interface CreateRouteData {
  name: string;
  categoryId: string;
  companyId: string;
  brandId: string;
  branchId: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
} 