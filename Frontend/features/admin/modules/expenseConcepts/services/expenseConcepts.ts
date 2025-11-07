import { apiCall } from "@/utils/api";
import { ExpenseConcept, CreateExpenseConceptData, UpdateExpenseConceptData } from "../types";

export interface ExpenseConceptFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  branch?: string;
  department?: string;
}

export interface GetExpenseConceptsResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: ExpenseConcept[];
}

export const expenseConceptsService = {
  getAllExpenseConcepts: async (filters: ExpenseConceptFilters = {}): Promise<GetExpenseConceptsResponse> => {
    const { page = 1, limit = 10, search, isActive, branch, department } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) searchParams.append('search', search);
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());
    if (branch) searchParams.append('branch', branch);
    if (department) searchParams.append('department', department);

    const response = await apiCall<GetExpenseConceptsResponse>(`/expense-concepts?${searchParams}`);
    return response;
  },

  getExpenseConceptById: async (conceptId: string): Promise<{ success: boolean; data: ExpenseConcept }> => {
    const response = await apiCall<{ success: boolean; data: ExpenseConcept }>(`/expense-concepts/${conceptId}`);
    return response;
  },

  createExpenseConcept: async (conceptData: CreateExpenseConceptData): Promise<{ success: boolean; data: ExpenseConcept; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ExpenseConcept; message: string }>("/expense-concepts", {
      method: "POST",
      body: JSON.stringify(conceptData),
    });
    return response;
  },

  updateExpenseConcept: async (
    conceptId: string,
    conceptData: UpdateExpenseConceptData
  ): Promise<{ success: boolean; data: ExpenseConcept; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ExpenseConcept; message: string }>(`/expense-concepts/${conceptId}`, {
      method: "PUT",
      body: JSON.stringify(conceptData),
    });
    return response;
  },

  activateExpenseConcept: async (conceptId: string): Promise<{ success: boolean; data: ExpenseConcept; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ExpenseConcept; message: string }>(`/expense-concepts/${conceptId}/activate`, {
      method: "PUT",
    });
    return response;
  },

  deactivateExpenseConcept: async (conceptId: string): Promise<{ success: boolean; data: ExpenseConcept; message: string }> => {
    const response = await apiCall<{ success: boolean; data: ExpenseConcept; message: string }>(`/expense-concepts/${conceptId}/deactivate`, {
      method: "PUT",
    });
    return response;
  },

  deleteExpenseConcept: async (conceptId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/expense-concepts/${conceptId}`, {
      method: "DELETE",
    });
    return response;
  },
};
