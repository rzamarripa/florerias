export interface Delivery {
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

export interface CreateDeliveryData {
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

export interface UpdateDeliveryData {
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

export interface CreateDeliveryResponseData {
  delivery: Delivery;
}

export interface GetDeliveryResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Delivery[];
}

export interface DeliveryFilters {
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

// Dealer interfaces
export interface Dealer {
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

export interface CreateDealerData {
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

export interface UpdateDealerData {
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

export interface CreateDealerResponseData {
  success: boolean;
  data: Dealer;
  message: string;
}

export interface GetDealersResponse {
  success: boolean;
  data: Dealer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DealerFilters {
  page?: number;
  limit?: number;
  nombre?: string;
  apellidoPaterno?: string;
  usuario?: string;
  correo?: string;
  telefono?: string;
  estatus?: boolean;
}

export type DealerFilterType = 'nombre' | 'apellidoPaterno' | 'usuario' | 'correo' | 'telefono';

export interface DealerFilterOption {
  value: DealerFilterType;
  label: string;
}