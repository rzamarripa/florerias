import { apiCall } from "@/utils/api";
import { ApiResponse, BankNumber, CreateBankNumberRequest, GetBankNumbersParams, Bank } from "../types";

const API_BASE = "/bank-numbers";

export async function getBankNumbers(params?: GetBankNumbersParams): Promise<ApiResponse<BankNumber[]>> {
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

export async function createBankNumber(data: CreateBankNumberRequest): Promise<ApiResponse<BankNumber>> {
  return apiCall(`${API_BASE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBankNumber(id: string, data: Partial<CreateBankNumberRequest>): Promise<ApiResponse<BankNumber>> {
  return apiCall(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteBankNumber(id: string): Promise<ApiResponse<void>> {
  return apiCall(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function getBanksForSelect(): Promise<ApiResponse<Bank[]>> {
  return apiCall(`${API_BASE}/banks`);
} 