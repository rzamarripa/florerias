export interface BankLayout {
  _id: string;
  layoutFolio: string;
  tipoLayout: 'grouped' | 'individual';
  descripcionTipo: string;
  fechaLayout: string;
  companyName: string;
  companyRfc: string;
  bankName: string;
  bankAccountNumber: string;
  cantidadProveedores: number;
  cantidadFacturas: number;
  cantidadPaquetes: number;
  totalAmount: number;
  totalRegistros: number;
  estatus: 'Generado' | 'Procesado' | 'Conciliado' | 'Cancelado';
  createdAt: string;
  updatedAt: string;
}

export interface GetBankLayoutsParams {
  page?: number;
  limit?: number;
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