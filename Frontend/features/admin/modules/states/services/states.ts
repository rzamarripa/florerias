import { apiCall, ApiResponse } from '@/utils/api';
import { State, Country } from '../types';
import { StateFormData } from '../schemas/stateSchema';

export const getAllFiltereds = async (): Promise<ApiResponse<State[]>> => {
  return await apiCall<State[]>(`/states/all`);
};

export const getAll = async (params?: { page?: number; limit?: number; search?: string; isActive?: string; }): Promise<ApiResponse<State[]>> => {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  return apiCall<State[]>(`/states${query}`);
};

export const getByCountryId = async (countryId: string): Promise<ApiResponse<State[]>> => {
  return apiCall<State[]>(`/states/country/${countryId}`);
};

// Obtener estado por ID
export const getById = async (id: string): Promise<ApiResponse<State>> => {
  return apiCall<State>(`/states/${id}`);
};

export const createState = async (data: StateFormData): Promise<ApiResponse<State>> => {
  return apiCall<State>(`/states`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateState = async (id: string, data: StateFormData): Promise<ApiResponse<State>> => {
  return apiCall<State>(`/states/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteState = async (id: string): Promise<ApiResponse<null>> => {
  return apiCall<null>(`/states/${id}`, {
    method: 'DELETE',
  });
};

export const activateState = async (id: string): Promise<ApiResponse<null>> => {
  return apiCall<null>(`/states/${id}/active`, {
    method: 'PUT',
  });
};

export const getAllCountries = async (): Promise<ApiResponse<Country[]>> => {
  return apiCall<Country[]>(`/countries/all`);
};

export const toggleStatus = async (id: string, currentStatus: boolean): Promise<ApiResponse<null>> => {
  if (currentStatus) {
    return await deleteState(id);
  } else {
    return await activateState(id);
  }
}; 