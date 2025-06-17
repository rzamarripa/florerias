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
