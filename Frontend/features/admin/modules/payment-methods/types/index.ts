export interface PaymentMethod {
  _id: string;
  name: string;
  abbreviation: string;
  status: boolean;
  branch: {
    _id: string;
    branchName: string;
    branchCode?: string;
  };
  company?: {
    _id: string;
    legalName: string;
    tradeName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodData {
  name: string;
  abbreviation: string;
  status?: boolean;
  branch?: string; // Se puede enviar vacío para Gerente, el backend lo determina
}

export interface UpdatePaymentMethodData {
  name?: string;
  abbreviation?: string;
  status?: boolean;
}

export interface GetPaymentMethodsResponse {
  success: boolean;
  data: PaymentMethod[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaymentMethodFilters {
  page?: number;
  limit?: number;
  status?: boolean;
  name?: string;
  branchId?: string;
}
