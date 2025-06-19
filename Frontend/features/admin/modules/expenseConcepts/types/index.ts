import { ExpenseConceptCategory } from "../../expenseConceptCategories/types";
import { ApiResponse } from "../../../../../types";
import { ExpenseConceptFormData } from "../schemas/expenseConceptSchema";

export interface ExpenseConcept {
  _id: string;
  name: string;
  description: string;
  categoryId: ExpenseConceptCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyExpenseConcept {
  _id: string;
  nombre: string;
  descripcion: string;
  categoriaId?: string;
  activo: boolean;
}

export type ExpenseConceptData = ExpenseConcept | LegacyExpenseConcept;

export type ExpenseConceptResponse = ApiResponse<ExpenseConcept>;

export type ExpenseConceptListResponse = ApiResponse<ExpenseConcept[]>;

export type ExpenseConceptDeleteResponse = ApiResponse<{ message: string }>;

export interface ExpenseConceptSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export type { ExpenseConceptFormData }; 