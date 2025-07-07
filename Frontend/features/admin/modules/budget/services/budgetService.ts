import { apiCall, ApiResponse } from "@/utils/api";
import { Budget, BudgetFormData, BudgetTreeNode } from "../types";

interface BudgetFilters {
  companyId?: string;
  categoryId?: string;
  branchId?: string;
  routeId?: string;
  brandId?: string;
  month?: string;
}

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

  async getBudgetsByMonth(month: string, filters?: BudgetFilters): Promise<ApiResponse<Budget[]>> {
    try {
      let url = `${this.baseUrl}/month/${month}`;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.companyId) params.append("companyId", filters.companyId);
        if (filters.categoryId) params.append("categoryId", filters.categoryId);
        if (filters.branchId) params.append("branchId", filters.branchId);
        if (filters.routeId) params.append("routeId", filters.routeId);
        if (filters.brandId) params.append("brandId", filters.brandId);
        url += `?${params.toString()}`;
      }
      return await apiCall<Budget[]>(url);
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
    filters?: BudgetFilters
  ): Promise<ApiResponse<Budget[]>> {
    try {
      let url = `${this.baseUrl}/category/${categoryId}`;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.month) params.append("month", filters.month);
        if (filters.companyId) params.append("companyId", filters.companyId);
        if (filters.branchId) params.append("branchId", filters.branchId);
        if (filters.routeId) params.append("routeId", filters.routeId);
        if (filters.brandId) params.append("brandId", filters.brandId);
        url += `?${params.toString()}`;
      }
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
