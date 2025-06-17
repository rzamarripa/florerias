import { ProveedorFormData } from "../schemas/providerSchema";

export interface Proveedor extends ProveedorFormData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateProveedorRequest = ProveedorFormData;

export interface UpdateProveedorRequest extends Partial<CreateProveedorRequest> {
  _id: string;
}

export interface GetProveedoresParams {
  page?: number;
  limit?: number;
  nombreComercial?: string;
  razonSocial?: string;
  nombreContacto?: string;
  status?: string;
  ciudad?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}