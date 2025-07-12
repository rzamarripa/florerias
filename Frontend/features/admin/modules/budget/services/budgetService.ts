import { apiCall, ApiResponse } from "@/utils/api";
import { Budget, BudgetFormData, BudgetTreeNode } from "../types";

class BudgetService {
  private baseUrl = "/budget";

  async getBudgetTree(
    month: string,
    userId?: string
  ): Promise<ApiResponse<BudgetTreeNode[]>> {
    try {
      const url = new URLSearchParams();
      url.append("month", month);
      if (userId) {
        url.append("userId", userId);
      }
      return await apiCall<BudgetTreeNode[]>(
        `${this.baseUrl}/tree?${url.toString()}`
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching budget tree",
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
}

export const budgetService = new BudgetService();
