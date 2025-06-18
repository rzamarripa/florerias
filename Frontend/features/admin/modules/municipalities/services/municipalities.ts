/* eslint-disable @typescript-eslint/no-unused-vars */
import { apiCall, ApiResponse } from '@/utils/api';
import { Municipality, MunicipalitySearchParams } from '../types';
import { MunicipalityFormData } from '../schemas/municipalitySchema';

export const getAllActives = async (): Promise<ApiResponse<Municipality[]>> => {
  return apiCall<Municipality[]>(`/municipalities/all`);
};

export const getAll = async (params?: MunicipalitySearchParams): Promise<ApiResponse<Municipality[]>> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined)
  );
  const query = Object.keys(cleanParams).length
    ? `?${new URLSearchParams(cleanParams as any).toString()}`
    : '';
  return apiCall<Municipality[]>(`/municipalities${query}`);
};

export const getById = async (id: string): Promise<ApiResponse<Municipality>> => {
  return apiCall<Municipality>(`/municipalities/${id}`);
};

export const getByStateId = async (stateId: string): Promise<ApiResponse<Municipality[]>> => {
  return apiCall<Municipality[]>(`/municipalities/state/${stateId}`);
};

export const createMunicipality = async (data: MunicipalityFormData): Promise<ApiResponse<Municipality>> => {
  return apiCall<Municipality>(`/municipalities`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateMunicipality = async (id: string, data: MunicipalityFormData): Promise<ApiResponse<Municipality>> => {
  return apiCall<Municipality>(`/municipalities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteMunicipality = async (id: string): Promise<ApiResponse<null>> => {
  return apiCall<null>(`/municipalities/${id}`, {
    method: 'DELETE',
  });
};

export const activateMunicipality = async (id: string): Promise<ApiResponse<null>> => {
  return apiCall<null>(`/municipalities/${id}/active`, {
    method: 'PUT',
  });
}; 