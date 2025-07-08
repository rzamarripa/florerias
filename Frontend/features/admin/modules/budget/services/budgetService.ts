import { apiCall, ApiResponse } from "@/utils/api";
import { Budget, BudgetFormData } from "../types";

interface BudgetFilters {
  companyId?: string;
  categoryId?: string;
  branchId?: string;
  routeId?: string;
  brandId?: string;
  month?: string;
}

export interface Category {
  _id: string;
  name: string;
  hasRoutes: boolean;
}

export interface Company {
  _id: string;
  name: string;
  legalRepresentative: string;
}

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  categoryId: string;
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
  companyId: string;
}

export interface Route {
  _id: string;
  name: string;
  description?: string;
  companyId: string;
  brandId: string;
  branchId: string;
}

class BudgetService {
  private baseUrl = "/budget";

  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      return await apiCall<Category[]>("/categories/all");
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching categories",
        data: [],
      };
    }
  }

  // Nuevos métodos para selects en cascada
  async getCompaniesByCategory(
    categoryId: string
  ): Promise<ApiResponse<Company[]>> {
    try {
      return await apiCall<Company[]>(
        `${this.baseUrl}/companies/category/${categoryId}`
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching companies by category",
        data: [],
      };
    }
  }

  async getBrandsByCategoryAndCompany(
    categoryId: string,
    companyId: string
  ): Promise<ApiResponse<Brand[]>> {
    try {
      return await apiCall<Brand[]>(
        `${this.baseUrl}/brands/category/${categoryId}/company/${companyId}`
      );
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message || "Error fetching brands by category and company",
        data: [],
      };
    }
  }

  async getBranchesByCompanyAndBrand(
    companyId: string,
    brandId: string
  ): Promise<ApiResponse<Branch[]>> {
    try {
      return await apiCall<Branch[]>(
        `${this.baseUrl}/branches/company/${companyId}/brand/${brandId}`
      );
    } catch (error: any) {
      return {
        success: false,
        message:
          error.message || "Error fetching branches by company and brand",
        data: [],
      };
    }
  }

  async getRoutesByCompanyBrandAndBranch(
    companyId: string,
    brandId: string,
    branchId: string
  ): Promise<ApiResponse<Route[]>> {
    try {
      return await apiCall<Route[]>(
        `${this.baseUrl}/routes/company/${companyId}/brand/${brandId}/branch/${branchId}`
      );
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching routes",
        data: [],
      };
    }
  }

  async getBudgetsByMonth(
    month: string,
    filters?: BudgetFilters
  ): Promise<ApiResponse<Budget[]>> {
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
