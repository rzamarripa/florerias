export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetCategoriesResponse {
  success: boolean;
  data: Category[];
  pagination?: PaginationInfo;
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
  message?: string;
}

export interface CategoryDeleteResponse {
  success: boolean;
  message: string;
}
export interface CategoryLegacy {
  _id: string;
  nombre: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface CategorySearchParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
}

export interface ExtendedCategoryFormData extends CategoryFormData {
  status?: boolean; // Para compatibilidad con formularios legacy
}

export const mapCategoryToLegacy = (category: Category): CategoryLegacy => ({
  _id: category._id,
  nombre: category.name,
  status: category.isActive,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt || category.createdAt,
  description: category.description,
});

export const mapLegacyToFormData = (legacy: CategoryLegacy): CategoryFormData => ({
  name: legacy.nombre,
  description: legacy.description,
});