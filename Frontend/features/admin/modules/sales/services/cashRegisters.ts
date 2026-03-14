import { apiCall } from "@/utils/api";

export interface CashRegister {
  _id: string;
  name: string;
  branchId: {
    _id: string;
    branchName: string;
    branchCode: string;
  };
  activeUser?: {
    _id: string;
    username: string;
    email: string;
  };
  managerId: {
    _id: string;
    username: string;
    email: string;
  };
  currentBalance: number;
  isOpen: boolean;
}

export interface GetOpenCashRegistersResponse {
  success: boolean;
  data: CashRegister[];
}

export const cashRegistersService = {
  // Obtener cajas abiertas por sucursal
  getOpenCashRegistersByBranch: async (branchId: string): Promise<CashRegister[]> => {
    const response = await apiCall<GetOpenCashRegistersResponse>(`/cash-registers/branch/${branchId}/open`);
    return response.data;
  },
};
