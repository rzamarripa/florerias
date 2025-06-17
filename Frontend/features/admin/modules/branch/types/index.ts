// types/sucursal.ts
import { SucursalFormData } from "../schemas/BranchSchema";

export interface Sucursal extends SucursalFormData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateSucursalRequest = SucursalFormData;

export interface UpdateSucursalRequest extends Partial<CreateSucursalRequest> {
  _id: string;
}

export interface GetSucursalesParams {
  page?: number;
  limit?: number;
  name?: string;
  status?: string;
  razonSocial?: string;
  ciudad?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}