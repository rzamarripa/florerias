import { apiCall } from "@/utils/api";
import {
  Department,
  DepartmentFormData,
  DepartmentSearchParams,
  DepartmentResponse,
  DepartmentDeleteResponse,
  DepartmentListResponse,
} from "../types";

export const departmentService = {
  getActive: async () => {
    return await apiCall<{ success: boolean; data: Pick<Department, '_id' | 'name' | 'brandId'>[] }>(
      "/departments/all"
    );
  },

  getAll: async (params: DepartmentSearchParams = {}) => {
    const { page = 1, limit = 15, search, brandId } = params;
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(brandId && { brandId }),
    });
    return await apiCall<DepartmentListResponse>(`/departments?${searchParams}`);
  },

  getById: async (id: string) => {
    return await apiCall<DepartmentResponse>(`/departments/${id}`);
  },

  create: async (data: DepartmentFormData) => {
    return await apiCall<DepartmentResponse>("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: DepartmentFormData) => {
    return await apiCall<DepartmentResponse>(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  activate: async (id: string) => {
    return await apiCall<DepartmentDeleteResponse>(`/departments/${id}/active`, {
      method: "PUT",
    });
  },

  delete: async (id: string) => {
    return await apiCall<DepartmentDeleteResponse>(`/departments/${id}`, {
      method: "DELETE",
    });
  },

  toggleStatus: async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      return await departmentService.delete(id);
    } else {
      return await departmentService.activate(id);
    }
  },
};

export const {
  getActive: getDepartmentsActive,
  getAll: getDepartments,
  getById: getDepartmentById,
  create: createDepartment,
  update: updateDepartment,
  activate: activateDepartment,
  delete: deleteDepartment,
  toggleStatus: toggleDepartmentStatus,
} = departmentService; 