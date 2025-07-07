import { apiCall, ApiResponse } from "@/utils/api";
import { Route, RouteFormData } from "../types";

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