import { apiCall, ApiResponse } from "@/utils/api";
import { Budget, BudgetFormData, BudgetTreeNode } from "../types";

class BudgetService {
  private baseUrl = "/budget";

  async getBudgetTreeData(): Promise<ApiResponse<BudgetTreeNode[]>> {
    try {
      return await apiCall<BudgetTreeNode[]>(`${this.baseUrl}/tree`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching budget tree data",
        data: [],
      };
    }
  }

  async getBudgetsByMonth(month: string): Promise<ApiResponse<Budget[]>> {
    try {
      return await apiCall<Budget[]>(`${this.baseUrl}/month/${month}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching budgets by month",
        data: [],
      };
    }
  }

  async getBudgetsByCategory(
    categoryId: string,
    month?: string
  ): Promise<ApiResponse<Budget[]>> {
    try {
      const url = month
        ? `${this.baseUrl}/category/${categoryId}?month=${month}`
        : `${this.baseUrl}/category/${categoryId}`;
      return await apiCall<Budget[]>(url);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching budgets by category",
        data: [],
      };
    }
  }

  async createBudget(budgetData: BudgetFormData): Promise<ApiResponse<Budget>> {
    try {
      return await apiCall<Budget>(this.baseUrl, {
        method: "POST",
        body: JSON.stringify(budgetData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error creating budget",
        data: {} as Budget,
      };
    }
  }

  async updateBudget(
    id: string,
    budgetData: Partial<BudgetFormData>
  ): Promise<ApiResponse<Budget>> {
    try {
      return await apiCall<Budget>(`${this.baseUrl}/${id}`, {
        method: "PUT",
        body: JSON.stringify(budgetData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error updating budget",
        data: {} as Budget,
      };
    }
  }

  async deleteBudget(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiCall<void>(`${this.baseUrl}/${id}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error deleting budget",
        data: undefined,
      };
    }
  }

  async calculateParentTotal(
    parentType: string,
    parentId: string,
    month: string
  ): Promise<ApiResponse<number>> {
    try {
      return await apiCall<number>(
        `${this.baseUrl}/total/${parentType}/${parentId}?month=${month}`
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error calculating parent total",
        data: 0,
      };
    }
  }
}

export const budgetService = new BudgetService();
