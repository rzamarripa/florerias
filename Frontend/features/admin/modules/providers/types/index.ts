// import { ProveedorFormData } from "../schemas/providerSchema";

export interface Location {
  _id: string;
  name: string;
}

export interface Provider {
  _id: string;
  commercialName: string;
  businessName: string;
  rfc: string;
  contactName: string;
  countryId: Location;
  stateId: Location;
  municipalityId: Location;
  address: string;
  phone: string;
  email: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateProviderRequest = {
  commercialName: string;
  businessName: string;
  rfc: string;
  contactName: string;
  countryId: string;
  stateId: string;
  municipalityId: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  _id: string;
}

export interface GetProvidersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationResponse;
}