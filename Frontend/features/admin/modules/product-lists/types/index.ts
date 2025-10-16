// Embedded Insumo (from Product)
export interface EmbeddedInsumo {
  _id?: string;
  materialId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  importeCosto: number;
  importeVenta: number;
}

// Embedded Product (stored within ProductList)
export interface EmbeddedProduct {
  productId: string;
  nombre: string;
  unidad: 'pieza' | 'paquete';
  descripcion: string;
  orden: number;
  imagen: string;
  insumos: EmbeddedInsumo[];
  cantidad: number;
  totalCosto: number;
  totalVenta: number;
  labour: number;
  estatus: boolean;
}

// Company info
export interface Company {
  _id: string;
  legalName: string;
  tradeName: string;
  rfc: string;
}

// ProductList main interface
export interface ProductList {
  _id: string;
  name: string;
  products: EmbeddedProduct[];
  company: Company;
  expirationDate: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product with quantity for creating/updating lists
export interface ProductWithQuantity {
  productId: string;
  cantidad: number;
}

// Create ProductList Data
export interface CreateProductListData {
  name: string;
  products: ProductWithQuantity[]; // Array of products with quantities
  company: string; // Company ID
  expirationDate: string;
}

// Update ProductList Data
export interface UpdateProductListData {
  name?: string;
  products?: ProductWithQuantity[]; // Array of products with quantities
  company?: string; // Company ID
  expirationDate?: string;
  status?: boolean;
}

// API Response interfaces
export interface GetProductListsResponse {
  success: boolean;
  data: ProductList[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetProductListByIdResponse {
  success: boolean;
  data: ProductList;
}

export interface CreateProductListResponse {
  success: boolean;
  data: ProductList;
  message: string;
}

export interface UpdateProductListResponse {
  success: boolean;
  data: ProductList;
  message: string;
}

export interface ProductListFilters {
  page?: number;
  limit?: number;
  name?: string;
  companyId?: string;
  status?: boolean;
}
