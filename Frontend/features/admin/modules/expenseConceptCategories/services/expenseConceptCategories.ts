import { apiCall } from "@/utils/api";
import {
  ExpenseConceptCategory,
  ExpenseConceptCategoryFormData,
} from "../types";

export interface ExpenseConceptCategorySearchParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
}

export const expenseConceptCategoryService = {
  getAll: async (params: ExpenseConceptCategorySearchParams = {}) => {
    const { page = 1, limit = 10, search, isActive } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(isActive && { isActive }),
    });
    return await apiCall<ExpenseConceptCategory[]>(
      `/expense-concept-categories?${searchParams}`
    );
  },

  getAllActive: async () => {
    return await apiCall<ExpenseConceptCategory[]>(
      `/expense-concept-categories/all`
    );
  },

  create: async (data: ExpenseConceptCategoryFormData) => {
    return await apiCall<ExpenseConceptCategory[]>(
      "/expense-concept-categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  update: async (id: string, data: ExpenseConceptCategoryFormData) => {
    return await apiCall<ExpenseConceptCategory[]>(
      `/expense-concept-categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  activate: async (id: string) => {
    return await apiCall<ExpenseConceptCategory[]>(
      `/expense-concept-categories/${id}/active`,
      {
        method: "PUT",
      }
    );
  },

  delete: async (id: string) => {
    return await apiCall<ExpenseConceptCategory[]>(
      `/expense-concept-categories/${id}`,
      {
        method: "DELETE",
      }
    );
  },

  toggleStatus: async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      return await expenseConceptCategoryService.delete(id);
    } else {
      return await expenseConceptCategoryService.activate(id);
    }
  },
};

export const {
  getAll: getExpenseConceptCategories,
  create: createExpenseConceptCategory,
  update: updateExpenseConceptCategory,
  activate: activateExpenseConceptCategory,
  delete: deleteExpenseConceptCategory,
  toggleStatus: toggleExpenseConceptCategoryStatus,
} = expenseConceptCategoryService;
