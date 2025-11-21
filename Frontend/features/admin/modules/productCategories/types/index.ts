export interface ProductCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCategoryData {
  name: string;
  description?: string;
}

export interface UpdateProductCategoryData extends CreateProductCategoryData {}
