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
  currentBalance?: number;
  claveBanxico?: string;
  bankId: {
    _id: string;
    name: string;
    bankNumber?: number;
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
  const response = await apiCall<any[]>(`/bank-accounts/by-company/${companyId}`);

  // Transformar la respuesta del backend para que coincida con la interfaz BankAccount
  const transformedBankAccounts = (response.data || []).map(account => ({
    _id: account._id,
    accountNumber: account.accountNumber,
    accountType: 'Cuenta Corriente', // Valor por defecto ya que no existe en el modelo backend
    currentBalance: account.currentBalance || 0,
    claveBanxico: account.claveBanxico || '',
    bankId: {
      _id: account.bank._id,
      name: account.bank.name,
      bankNumber: account.bank.bankNumber
    }
  }));

  return transformedBankAccounts;
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