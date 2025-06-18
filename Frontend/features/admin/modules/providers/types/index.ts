// import { ProveedorFormData } from "../schemas/providerSchema";

export interface Provider {
  _id: string;
  commercialName: string;
  businessName: string;
  contactName: string;
  countryId: string | { _id: string; name: string };
  stateId: string | { _id: string; name: string };
  municipalityId: string | { _id: string; name: string };
  address: string;
  phone: string;
  email: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateProviderRequest = Omit<Provider, '_id' | 'createdAt' | 'updatedAt'>;

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  _id: string;
}

export interface GetProvidersParams {
  page?: number;
  limit?: number;
  commercialName?: string;
  businessName?: string;
  contactName?: string;
  isActive?: boolean | string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}