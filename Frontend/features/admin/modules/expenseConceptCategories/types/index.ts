export interface ExpenseConceptCategory {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface ExpenseConceptCategoryFormData {
  name: string;
}
