import { apiCall } from "@/utils/api";
import { CashRegister, CreateCashRegisterData, UpdateCashRegisterData, User, Branch } from "../types";

export interface CashRegisterFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  isOpen?: boolean;
  isActive?: boolean;
}

export interface GetCashRegistersResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: CashRegister[];
}

export interface GetEmployeesByAdminResponse {
  success: boolean;
  data: {
    cashiers: User[];
    managers: User[];
    branches: Branch[];
  };
}

export const cashRegistersService = {
  getAllCashRegisters: async (filters: CashRegisterFilters = {}): Promise<GetCashRegistersResponse> => {
    const { page = 1, limit = 10, branchId, isOpen, isActive } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (branchId) searchParams.append('branchId', branchId);
    if (isOpen !== undefined) searchParams.append('isOpen', isOpen.toString());
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());

    const response = await apiCall<GetCashRegistersResponse>(`/cash-registers?${searchParams}`);
    return response as any;
  },

  getCashRegisterById: async (cashRegisterId: string): Promise<{ success: boolean; data: CashRegister }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister }>(`/cash-registers/${cashRegisterId}`);
    return response as any;
  },

  createCashRegister: async (cashRegisterData: CreateCashRegisterData): Promise<{ success: boolean; data: CashRegister; message: string }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister; message: string }>("/cash-registers", {
      method: "POST",
      body: JSON.stringify(cashRegisterData),
    });
    return response as any;
  },

  updateCashRegister: async (
    cashRegisterId: string,
    cashRegisterData: UpdateCashRegisterData
  ): Promise<{ success: boolean; data: CashRegister; message: string }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister; message: string }>(`/cash-registers/${cashRegisterId}`, {
      method: "PUT",
      body: JSON.stringify(cashRegisterData),
    });
    return response as any;
  },

  toggleActive: async (cashRegisterId: string, isActive: boolean): Promise<{ success: boolean; data: CashRegister; message: string }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister; message: string }>(
      `/cash-registers/${cashRegisterId}/toggle-active`,
      {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      }
    );
    return response as any;
  },

  toggleOpen: async (cashRegisterId: string, isOpen: boolean): Promise<{ success: boolean; data: CashRegister; message: string }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister; message: string }>(
      `/cash-registers/${cashRegisterId}/toggle-open`,
      {
        method: "PUT",
        body: JSON.stringify({ isOpen }),
      }
    );
    return response as any;
  },

  deleteCashRegister: async (cashRegisterId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/cash-registers/${cashRegisterId}`, {
      method: "DELETE",
    });
    return response as any;
  },

  getCashiersAndManagersByAdmin: async (adminId: string): Promise<GetEmployeesByAdminResponse> => {
    const response = await apiCall<GetEmployeesByAdminResponse>(`/cash-registers/admin/${adminId}/employees`);
    return response as any;
  },

  getManagerBranch: async (managerId: string): Promise<GetEmployeesByAdminResponse> => {
    const response = await apiCall<GetEmployeesByAdminResponse>(`/cash-registers/manager/${managerId}/branch`);
    return response as any;
  },

  getUserCashRegister: async (): Promise<{ success: boolean; data: CashRegister | null; message?: string }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister | null; message?: string }>("/cash-registers/user/cash-register");
    return response as any;
  },

  registerExpense: async (
    cashRegisterId: string,
    expenseData: { expenseConcept: string; amount: number }
  ): Promise<{ success: boolean; data: CashRegister; message: string }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister; message: string }>(
      `/cash-registers/${cashRegisterId}/expense`,
      {
        method: "POST",
        body: JSON.stringify(expenseData),
      }
    );
    return response as any;
  },

  getCashRegisterSummary: async (cashRegisterId: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiCall<{ success: boolean; data: any }>(`/cash-registers/${cashRegisterId}/summary`);
    return response as any;
  },

  closeCashRegister: async (
    cashRegisterId: string,
    remainingBalance: number
  ): Promise<{ success: boolean; data: CashRegister; message: string }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister; message: string }>(
      `/cash-registers/${cashRegisterId}/close`,
      {
        method: "POST",
        body: JSON.stringify({ remainingBalance }),
      }
    );
    return response as any;
  },

  getSocialMediaCashRegisters: async (filters: CashRegisterFilters = {}): Promise<GetCashRegistersResponse> => {
    const { page = 1, limit = 10, branchId, isOpen, isActive } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (branchId) searchParams.append('branchId', branchId);
    if (isOpen !== undefined) searchParams.append('isOpen', isOpen.toString());
    if (isActive !== undefined) searchParams.append('isActive', isActive.toString());

    const response = await apiCall<GetCashRegistersResponse>(`/cash-registers/social-media?${searchParams}`);
    return response as any;
  },

  getSocialMediaCashRegistersByBranch: async (branchId: string): Promise<{ success: boolean; data: CashRegister[] }> => {
    const response = await apiCall<{ success: boolean; data: CashRegister[] }>(`/cash-registers/branch/${branchId}/social-media`);
    return response as any;
  },
};
