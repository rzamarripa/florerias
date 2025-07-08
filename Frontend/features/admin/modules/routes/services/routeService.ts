import { apiCall, ApiResponse } from "@/utils/api";
import { Route, RouteFormData } from "../types";

interface Category {
  _id: string;
  name: string;
  hasRoutes: boolean;
}

interface Company {
  _id: string;
  name: string;
  legalRepresentative: string;
}

interface Brand {
  _id: string;
  name: string;
  description?: string;
  categoryId: string;
}

interface Branch {
  _id: string;
  name: string;
  address: string;
  companyId: string;
}

class RouteService {
  private baseUrl = "/routes";

  async getAllRoutes(): Promise<ApiResponse<Route[]>> {
    try {
      return await apiCall<Route[]>(this.baseUrl);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching routes",
        data: [],
      };
    }
  }

  async getRouteById(id: string): Promise<ApiResponse<Route>> {
    try {
      return await apiCall<Route>(`${this.baseUrl}/${id}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching route",
        data: {} as Route,
      };
    }
  }

  async createRoute(routeData: RouteFormData): Promise<ApiResponse<Route>> {
    try {
      return await apiCall<Route>(this.baseUrl, {
        method: "POST",
        body: JSON.stringify(routeData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error creating route",
        data: {} as Route,
      };
    }
  }

  async updateRoute(
    id: string,
    routeData: Partial<RouteFormData>
  ): Promise<ApiResponse<Route>> {
    try {
      return await apiCall<Route>(`${this.baseUrl}/${id}`, {
        method: "PUT",
        body: JSON.stringify(routeData),
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error updating route",
        data: {} as Route,
      };
    }
  }

  async deleteRoute(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiCall<void>(`${this.baseUrl}/${id}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error deleting route",
        data: undefined,
      };
    }
  }

  async getRoutesByCategory(categoryId: string): Promise<ApiResponse<Route[]>> {
    try {
      return await apiCall<Route[]>(`${this.baseUrl}/category/${categoryId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching routes by category",
        data: [],
      };
    }
  }

  async getRoutesByBranch(branchId: string): Promise<ApiResponse<Route[]>> {
    try {
      return await apiCall<Route[]>(`${this.baseUrl}/branch/${branchId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching routes by branch",
        data: [],
      };
    }
  }

  async getRoutesByBrand(brandId: string): Promise<ApiResponse<Route[]>> {
    try {
      return await apiCall<Route[]>(`${this.baseUrl}/brand/${brandId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching routes by brand",
        data: [],
      };
    }
  }

  async getRoutesByCompany(companyId: string): Promise<ApiResponse<Route[]>> {
    try {
      return await apiCall<Route[]>(`${this.baseUrl}/company/${companyId}`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching routes by company",
        data: [],
      };
    }
  }

  // Nuevos métodos para selects en cascada (mismo patrón que budgetService)
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await apiCall<Category[]>("/categories/all");
      if (response.success) {
        // Filtrar solo las categorías con hasRoutes === true
        response.data = response.data.filter(category => category.hasRoutes);
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching categories",
        data: [],
      };
    }
  }

  async getCompaniesByCategory(
    categoryId: string
  ): Promise<ApiResponse<Company[]>> {
    try {
      return await apiCall<Company[]>(
        `/budget/companies/category/${categoryId}`
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
        `/budget/brands/category/${categoryId}/company/${companyId}`
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
        `/budget/branches/company/${companyId}/brand/${brandId}`
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

  async getUserVisibilityStructure(userId: string): Promise<any> {
    try {
      return await apiCall(`/role-visibility/${userId}/structure`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching user visibility structure",
        data: {},
      };
    }
  }

  async getUserVisibilitySelects(userId: string): Promise<any> {
    try {
      return await apiCall(`/role-visibility/${userId}/selects`);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Error fetching user visibility selects",
        data: {},
      };
    }
  }
}

export const routeService = new RouteService(); 