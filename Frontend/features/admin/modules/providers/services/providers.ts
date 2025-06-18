import { apiCall } from "@/utils/api";

const API_BASE = "/providers";
const API_COUNTRIES = "/countries";

export async function getProviders(params?: { page?: number; limit?: number; search?: string; status?: string }) {
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

export async function getAllProviders() {
  return apiCall(`${API_BASE}/all`);
}

export async function createProvider(data: any) {
  return apiCall(`${API_BASE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProvider(id: string, data: any) {
  return apiCall(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProvider(id: string) {
  return apiCall(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function activateProvider(id: string) {
  return apiCall(`${API_BASE}/activate/${id}`, { method: "PATCH" });
}

export async function getStatesByCountry(countryId: string) {
  return apiCall(`${API_BASE}/states/by-country/${countryId}`);
}

export async function getMunicipalitiesByState(stateId: string) {
  return apiCall(`${API_BASE}/municipalities/by-state/${stateId}`);
}

export async function getAllCountries() {
  return apiCall(`${API_COUNTRIES}/all`);
} 