export interface Insumo {
  _id?: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  importeCosto: number;
  importeVenta: number;
}

export interface Product {
  _id: string;
  nombre: string;
  unidad: 'pieza' | 'paquete';
  descripcion: string;
  orden: number;
  imagen: string;
  insumos: Insumo[];
  totalCosto: number;
  totalVenta: number;
  estatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  nombre: string;
  unidad: 'pieza' | 'paquete';
  descripcion?: string;
  orden?: number;
  imagen?: string;
  insumos?: Insumo[];
  estatus?: boolean;
}

export interface UpdateProductData {
  nombre?: string;
  unidad?: 'pieza' | 'paquete';
  descripcion?: string;
  orden?: number;
  imagen?: string;
  insumos?: Insumo[];
  estatus?: boolean;
}

export interface CreateProductResponseData {
  success: boolean;
  data: Product;
  message: string;
}

export interface GetProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  nombre?: string;
  unidad?: string;
  estatus?: boolean;
}

export type UnidadType = 'pieza' | 'paquete';
export type InsumoType = '100 rosas' | '12 rosas' | '50 rosas';
