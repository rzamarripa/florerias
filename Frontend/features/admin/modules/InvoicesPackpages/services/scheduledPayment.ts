import { apiCall, ApiResponse } from "@/utils/api";

export interface Company {
  _id: string;
  name: string;
  rfc: string;
  legalRepresentative: string;
}

export interface BankAccount {
  _id: string;
  accountNumber: string;
  accountType: string;
  bankId: {
    _id: string;
    name: string;
  };
}

export interface ScheduledPayment {
  _id: string;
  companyId: {
    _id: string;
    name: string;
    rfc: string;
  };
  bankAccountId: {
    _id: string;
    accountNumber: string;
    accountType: string;
  };
  packageId: string;
  userId: {
    _id: string;
    username: string;
    profile: {
      fullName: string;
    };
  };
  scheduledDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePaymentRequest {
  packageId: string;
  companyId: string;
  bankAccountId: string;
}

// Servicio para obtener todas las razones sociales
export const getAllCompanies = async (): Promise<Company[]> => {
  const response = await apiCall<Company[]>("/companies/all");
  return response.data || [];
};

// Servicio para obtener cuentas bancarias por companyId
export const getBankAccountsByCompany = async (companyId: string): Promise<BankAccount[]> => {
  const response = await apiCall<BankAccount[]>(`/bank-accounts/by-company/${companyId}`);
  return response.data || [];
};

// Servicio para programar un pago
export const schedulePayment = async (data: SchedulePaymentRequest): Promise<ApiResponse<ScheduledPayment>> => {
  const response = await apiCall<ScheduledPayment>("/scheduled-payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response;
};

// Servicio para obtener pago programado por paquete
export const getScheduledPaymentByPackage = async (packageId: string): Promise<ScheduledPayment | null> => {
  try {
    const response = await apiCall<ScheduledPayment>(`/scheduled-payments/by-package/${packageId}`);
    return response.data;
  } catch {
    return null;
  }
}; 