export interface UserProvider {
  _id: string;
  userId: string;
  providerId: {
    _id: string;
    commercialName: string;
    businessName: string;
    contactName: string;
    rfc: string;
    isActive: boolean;
  };
  createdAt: string;
}

export interface GetUserProvidersResponse {
  success: boolean;
  data: UserProvider[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Company {
  _id: string;
  name: string;
  legalRepresentative: string;
  rfc: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  _id: string;
  name: string;
  companyId: {
    _id: string;
    name: string;
  };
  address: string;
  phone: string;
  email: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GetCompaniesResponse {
  success: boolean;
  data: Company[];
}

export interface GetBrandsByCompanyResponse {
  success: boolean;
  data: Brand[];
}

export interface GetBranchesByBrandResponse {
  success: boolean;
  data: Branch[];
}

// Tipos para InvoicesPackage
export interface ImportedInvoice {
  _id: string;
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  importeAPagar: number;
  importePagado: number;
  tipoComprobante: 'I' | 'E' | 'P';
  estatus: 0 | 1;
  estadoPago: 0 | 1 | 2 | 3;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesPackage {
  _id: string;
  facturas: ImportedInvoice[];
  estatus: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado' | 'Pagado' | 'Cancelado';
  usuario_id: string;
  fechaCreacion: string;
  departamento_id: number;
  departamento: string;
  totalImporteAPagar: number;
  totalPagado: number;
  comentario?: string;
  fechaPago: string;
  folio: number;
  totalFacturas: number;
  createdAt: string;
  updatedAt: string;
  // Campos virtuales
  estaCompleto?: boolean;
  porcentajePagado?: number;
  tieneSaldoPendiente?: boolean;
  saldo?: number;
  estaVencido?: boolean;
  diasParaVencimiento?: number;
}

export interface GetInvoicesPackagesResponse {
  success: boolean;
  data: InvoicesPackage[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  message?: string;
}

export interface CreateInvoicesPackageRequest {
  facturas: string[];
  usuario_id: string;
  departamento_id: number;
  departamento: string;
  comentario?: string;
  fechaPago: string;
  totalImporteAPagar?: number;
}

export interface UpdateInvoicesPackageRequest {
  facturas?: string[];
  estatus?: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado' | 'Pagado' | 'Cancelado';
  departamento_id?: number;
  departamento?: string;
  comentario?: string;
  fechaPago?: string;
  totalImporteAPagar?: number;
}

export interface InvoicesPackageSummary {
  total: number;
  borradores: number;
  enviados: number;
  aprobados: number;
  pagados: number;
  vencidos: number;
}

export interface GetInvoicesPackagesSummaryResponse {
  success: boolean;
  data: InvoicesPackageSummary;
  message?: string;
} 