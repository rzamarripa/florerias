export interface Budget {
  _id: string;
  routeId?: {
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
  categoryId: {
    _id: string;
    name: string;
    hasRoutes: boolean;
  };
  assignedAmount: number;
  month: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetTreeNode {
  id: string;
  text: string;
  parent: string;
  type: "category" | "company" | "branch" | "brand" | "route";
  hasRoutes?: boolean;
  assignedAmount?: number;
  state?: {
    opened?: boolean;
    selected?: boolean;
  };
  data?: {
    categoryId?: string;
    companyId?: string;
    branchId?: string;
    brandId?: string;
    routeId?: string;
  };
}

export interface BudgetFormData {
  categoryId: string;
  companyId: string;
  branchId: string;
  brandId: string;
  routeId?: string;
  assignedAmount: number;
  month: string;
}
