import { apiCall } from "@/utils/api";
import {  Department, ExpenseConcept, BudgetByConceptResponse, PaidByConceptResponse, PendingByConceptResponse } from "../types";

export const expenseConceptBudgetService = {
  getAllExpenseConcepts: async (filters: { departmentId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    
    if (filters.departmentId) {
      searchParams.append("departmentId", filters.departmentId);
    }

    const response = await apiCall<ExpenseConcept[]>(`/expense-concept-budget/expense-concepts?${searchParams}`);
    return response;
  },

  getBudgetByExpenseConceptId: async (expenseConceptId: string, month?: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append("expenseConceptId", expenseConceptId);
    
    if (month) {
      searchParams.append("month", month);
    }

    const response = await apiCall<BudgetByConceptResponse>(`/expense-concept-budget/budget-by-concept?${searchParams}`);
    return response;
  },

  getPaidByExpenseConceptId: async (expenseConceptId: string, month?: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append("expenseConceptId", expenseConceptId);
    
    if (month) {
      searchParams.append("month", month);
    }

    const response = await apiCall<PaidByConceptResponse>(`/expense-concept-budget/paid-by-concept?${searchParams}`);
    return response;
  },

  getPendingByExpenseConceptId: async (expenseConceptId: string, month?: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append("expenseConceptId", expenseConceptId);
    
    if (month) {
      searchParams.append("month", month);
    }

    const response = await apiCall<PendingByConceptResponse>(`/expense-concept-budget/pending-by-concept?${searchParams}`);
    return response;
  },

  getDepartments: async () => {
    const response = await apiCall<Department[]>("/departments");
    return response;
  },
}; 