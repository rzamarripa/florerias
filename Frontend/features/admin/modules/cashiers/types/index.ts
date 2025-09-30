export interface Cashier {
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
  cajero: boolean;
  estatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashierData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  direccion: string;
  telefono: string;
  correo: string;
  usuario: string;
  contrasena: string;
  foto?: string;
  cajero?: boolean;
  estatus?: boolean;
}

export interface UpdateCashierData {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  usuario?: string;
  contrasena?: string;
  foto?: string;
  cajero?: boolean;
  estatus?: boolean;
}

export interface CreateCashierResponseData {
  success: boolean;
  data: Cashier;
  message: string;
}

export interface GetCashiersResponse {
  success: boolean;
  data: Cashier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CashierFilters {
  page?: number;
  limit?: number;
  nombre?: string;
  apellidoPaterno?: string;
  usuario?: string;
  correo?: string;
  telefono?: string;
  cajero?: boolean;
  estatus?: boolean;
}

export type FilterType = 'nombre' | 'apellidoPaterno' | 'usuario' | 'correo' | 'telefono';

export interface FilterOption {
  value: FilterType;
  label: string;
}