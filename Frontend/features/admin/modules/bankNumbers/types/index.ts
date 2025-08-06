export interface Bank {
  _id: string;
  name: string;
}

export interface BankNumber {
  _id: string;
  bankDebited: Bank;
  bankCredited: string;
  bankNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankNumberRequest {
  bankDebited: string;
  bankCredited: string;
  bankNumber: string;
}

export interface UpdateBankNumberRequest extends Partial<CreateBankNumberRequest> {
  _id: string;
}

export interface GetBankNumbersParams {
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