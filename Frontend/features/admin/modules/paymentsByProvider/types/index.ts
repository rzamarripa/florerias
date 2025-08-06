export interface PaymentByProvider {
  _id: string;
  groupingFolio: string;
  totalAmount: number;
  providerRfc: string;
  providerName: string;
  branchName: string;
  companyProvider: string;
  bankNumber: string;
  debitedBankAccount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalInvoices?: number;
}

export interface GroupInvoicesRequest {
  packageIds: string[];
  bankAccountId: string;
}

export interface GroupInvoicesResponse {
  success: boolean;
  message: string;
  data: PaymentByProvider[];
}

export interface GetPaymentsByProviderParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationResponse;
} 