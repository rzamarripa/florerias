export interface ProductCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  company?: {
    _id: string;
    legalName: string;
    tradeName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCategoryData {
  name: string;
  description?: string;
}

export interface UpdateProductCategoryData extends CreateProductCategoryData {}
