import { Brand } from "../../brands/types";
import { ApiResponse } from "@/types";
import { DepartmentFormData } from "../schemas/departmentSchema";

export interface Department {
  _id: string;
  name: string;
  brandId: Brand;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DepartmentResponse = ApiResponse<Department>;
export type DepartmentListResponse = ApiResponse<Department[]>;
export type DepartmentDeleteResponse = ApiResponse<{ message: string }>;

export interface DepartmentSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
}

export type { DepartmentFormData }; 