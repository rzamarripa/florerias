export interface Manager {
  _id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  direccion: string;
  telefono: string;
  correo: string;
  usuario: string;
  foto?: string;
  estatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagerData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  direccion: string;
  telefono: string;
  correo: string;
  usuario: string;
  contrasena: string;
  foto?: string;
  estatus: boolean;
}

export interface UpdateManagerData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  direccion: string;
  telefono: string;
  correo: string;
  usuario: string;
  contrasena?: string;
  foto?: string;
  estatus: boolean;
}

export interface ManagerFilters {
  page?: number;
  limit?: number;
  nombre?: string;
  apellidoPaterno?: string;
  usuario?: string;
  correo?: string;
  telefono?: string;
  estatus?: boolean;
}

export type FilterType = "nombre" | "apellidoPaterno" | "usuario" | "correo" | "telefono";

export interface FilterOption {
  value: FilterType;
  label: string;
}

export interface CreateManagerResponseData {
  success: boolean;
  data: Manager;
  message: string;
}

export interface GetManagerResponse {
  success: boolean;
  data: Manager[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}