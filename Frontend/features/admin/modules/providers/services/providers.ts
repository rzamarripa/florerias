import { apiCall } from "@/utils/api";
import { ApiResponse, Provider, CreateProviderRequest, GetProvidersParams, Location, BankAccount } from "../types";

const API_BASE = "/providers";
const API_COUNTRIES = "/countries";

export async function getProviders(params?: GetProvidersParams): Promise<ApiResponse<Provider[]>> {
  let url = `${API_BASE}`;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.append(key, String(value));
    });
    if (Array.from(query).length > 0) url += `?${query.toString()}`;
  }
  return apiCall(url);
}

export async function getAllProviders(): Promise<ApiResponse<Provider[]>> {
  return apiCall(`${API_BASE}/all`);
}

export async function createProvider(data: CreateProviderRequest): Promise<ApiResponse<Provider>> {
  return apiCall(`${API_BASE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProvider(id: string, data: Partial<CreateProviderRequest>): Promise<ApiResponse<Provider>> {
  return apiCall(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProvider(id: string): Promise<ApiResponse<void>> {
  return apiCall(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function activateProvider(id: string): Promise<ApiResponse<Provider>> {
  return apiCall(`${API_BASE}/activate/${id}`, { method: "PATCH" });
}

export async function getAllCountries(): Promise<ApiResponse<Location[]>> {
  return apiCall(API_COUNTRIES);
}

export async function getStatesByCountry(countryId: string): Promise<ApiResponse<Location[]>> {
  return apiCall(`${API_BASE}/states/by-country/${countryId}`);
}

export async function getMunicipalitiesByState(stateId: string): Promise<ApiResponse<Location[]>> {
  return apiCall(`${API_BASE}/municipalities/by-state/${stateId}`);
}

export async function getAllBanks(): Promise<ApiResponse<Location[]>> {
  return apiCall(`${API_BASE}/banks`);
}

export async function getAllBranches(): Promise<ApiResponse<Location[]>> {
  return apiCall(`${API_BASE}/branches`);
}

export async function getBankAccountsByBank(bankId: string): Promise<ApiResponse<BankAccount[]>> {
  return apiCall(`${API_BASE}/bank-accounts/by-bank/${bankId}`);
} 