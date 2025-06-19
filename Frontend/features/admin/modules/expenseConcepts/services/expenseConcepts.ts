import { apiCall } from "@/utils/api";
import {
  ExpenseConcept,
  ExpenseConceptFormData,
  ExpenseConceptSearchParams,
  ExpenseConceptResponse,
  ExpenseConceptDeleteResponse,
  ExpenseConceptListResponse
} from "../types";

export const expenseConceptService = {
  getActive: async () => {
    return await apiCall<{ success: boolean; data: Pick<ExpenseConcept, '_id' | 'name' | 'categoryId'>[] }>(
      "/expense-concept/all"
    );
  },

  getAll: async (params: ExpenseConceptSearchParams = {}) => {
    const { page = 1, limit = 10, search, categoryId, isActive } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(categoryId && { categoryId }),
      ...(isActive && { isActive: isActive.toString() }),
    });
    return await apiCall<ExpenseConceptListResponse>(`/expense-concept?${searchParams}`);
  },

  getById: async (id: string) => {
    return await apiCall<ExpenseConceptResponse>(`/expense-concept/${id}`);
  },

  create: async (data: ExpenseConceptFormData) => {
    return await apiCall<ExpenseConceptResponse>("/expense-concept", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: ExpenseConceptFormData) => {
    return await apiCall<ExpenseConceptResponse>(`/expense-concept/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  activate: async (id: string) => {
    return await apiCall<ExpenseConceptDeleteResponse>(`/expense-concept/${id}/active`, {
      method: "PUT",
    });
  },

  delete: async (id: string) => {
    return await apiCall<ExpenseConceptDeleteResponse>(`/expense-concept/${id}`, {
      method: "DELETE",
    });
  },

  toggleStatus: async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      return await expenseConceptService.delete(id);
    } else {
      return await expenseConceptService.activate(id);
    }
  },
};

export const {
  getActive: getExpenseConceptsActive,
  getAll: getExpenseConcepts,
  getById: getExpenseConceptById,
  create: createExpenseConcept,
  update: updateExpenseConcept,
  activate: activateExpenseConcept,
  delete: deleteExpenseConcept,
  toggleStatus: toggleExpenseConceptStatus,
} = expenseConceptService; 