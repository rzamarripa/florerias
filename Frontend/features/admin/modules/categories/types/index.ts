import { CategoryFormData } from "../schemas/categorySchema";


export interface Category extends CategoryFormData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCategoryRequest = CategoryFormData;

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  _id: string;
}

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  nombre?: string;
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}