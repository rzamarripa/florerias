export interface Budget {
  _id: string;
  routeId?: string;
  brandId: string;
  companyId: string;
  branchId: string;
  categoryId: string;
  expenseConceptId: string;
  assignedAmount: number;
  month: string;
}

export interface BudgetFormData {
  categoryId: string;
  companyId: string;
  branchId: string;
  brandId: string;
  routeId?: string;
  expenseConceptId: string;
  assignedAmount: number;
  month: string;
}

export interface BudgetTreeNode {
  id: string;
  text: string;
  type: "category" | "company" | "brand" | "branch" | "route" | "expense_concept";
  total?: number;
  budgetAmount?: number;
  canAssignBudget?: boolean;
  hasRoutes?: boolean;
  entityIds?: Partial<BudgetFormData>;
  children?: BudgetTreeNode[];
}
