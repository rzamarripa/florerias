import { apiCall } from "@/utils/api";
import {
  Expense,
  ExpenseFilters,
  CreateExpenseData,
  GetExpensesResponse,
  UpdateExpenseData,
} from "../types";

export const expensesService = {
  getAllExpenses: async (filters: ExpenseFilters = {}): Promise<GetExpensesResponse> => {
    const { page = 1, limit = 10, expenseType, startDate, endDate, branchId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (expenseType) searchParams.append('expenseType', expenseType);
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (branchId) searchParams.append('branchId', branchId);

    const response = await apiCall<GetExpensesResponse>(`/expenses?${searchParams}`);
    return response;
  },

  getExpenseById: async (expenseId: string): Promise<{ success: boolean; data: Expense }> => {
    const response = await apiCall<{ success: boolean; data: Expense }>(`/expenses/${expenseId}`);
    return response;
  },

  createExpense: async (expenseData: CreateExpenseData): Promise<{ success: boolean; data: Expense; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Expense; message: string }>("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
    return response;
  },

  updateExpense: async (
    expenseId: string,
    expenseData: UpdateExpenseData
  ): Promise<{ success: boolean; data: Expense; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Expense; message: string }>(`/expenses/${expenseId}`, {
      method: "PUT",
      body: JSON.stringify(expenseData),
    });
    return response;
  },

  deleteExpense: async (expenseId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/expenses/${expenseId}`, {
      method: "DELETE",
    });
    return response;
  },
};
