export interface Production {
  _id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  direccion: string;
  telefono: string;
  correo: string;
  usuario: string;
  contrasena?: string;
  foto: string;
  estatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  direccion: string;
  telefono: string;
  correo: string;
  usuario: string;
  contrasena: string;
  foto?: string;
  estatus?: boolean;
}

export interface UpdateProductionData {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  usuario?: string;
  contrasena?: string;
  foto?: string;
  estatus?: boolean;
}

export interface CreateProductionResponseData {
  success: boolean;
  data: Production;
  message: string;
}

export interface GetProductionResponse {
  success: boolean;
  data: Production[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductionFilters {
  page?: number;
  limit?: number;
  nombre?: string;
  apellidoPaterno?: string;
  usuario?: string;
  correo?: string;
  telefono?: string;
  estatus?: boolean;
}

export type FilterType = 'nombre' | 'apellidoPaterno' | 'usuario' | 'correo' | 'telefono';

export interface FilterOption {
  value: FilterType;
  label: string;
}