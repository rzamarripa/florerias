export interface Factura {
  _id: string;
  uuid: string;
  nombreEmisor: string;
  rfcEmisor: string;
  importeAPagar: number;
  importePagado: number;
  totalPagado?: number;
  numeroReferencia?: string;
  packageFolio: string;
  fechaEmision: string;
  coinciliado?: boolean;
  referenciaConciliacion?: string;
  packageId?: string;
  folio?: string;
}

export interface MovimientoBancario {
  _id: string;
  company: {
    _id: string;
    name: string;
  };
  bankAccount: {
    _id: string;
    accountNumber: string;
    clabe: string;
  };
  fecha: string;
  concepto: string;
  referencia?: string;
  cargo: number;
  abono: number;
  saldo: number;
  coinciliado: boolean;
  referenciaConciliacion?: string;
  createdAt: string;
}

export interface Company {
  _id: string;
  name: string;
  legalRepresentative?: string;
  rfc?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface BankAccount {
  _id: string;
  accountNumber: string;
  clabe: string;
  claveBanxico?: string;
  branch?: string;
  currentBalance?: number;
  bank: {
    _id: string;
    name: string;
  };
}

export interface Conciliacion {
  facturaId: string;
  movimientoId: string;
  comentario?: string;
  referenciaConciliacion?: string;
  tipo: 'automatica' | 'manual';
}

export interface ConciliacionMatch {
  factura: Factura;
  movimiento: MovimientoBancario;
  referenciaConciliacion: string;
}

export interface ConciliacionAutomaticaResponse {
  coincidencias: ConciliacionMatch[];
  facturasNoCoinciden: Factura[];
  movimientosNoCoinciden: MovimientoBancario[];
  totalCoincidencias: number;
}

export interface GetFacturasResponse {
  success: boolean;
  data: Factura[];
  message?: string;
}

export interface GetMovimientosResponse {
  success: boolean;
  data: MovimientoBancario[];
  message?: string;
}

export interface GetCompaniesResponse {
  success: boolean;
  data: Company[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetBankAccountsResponse {
  success: boolean;
  data: BankAccount[];
  message?: string;
}

export interface ConciliacionAutomaticaRequest {
  companyId: string;
  bankAccountId: string;
  fecha: string;
}

export interface ConciliacionManualRequest {
  facturaId: string;
  movimientoId: string;
  comentario?: string;
}

export interface ConciliacionDirectaRequest {
  facturaId: string;
  movimientoIds: string[];
  comentario?: string;
}

export interface CerrarConciliacionRequest {
  conciliaciones: Conciliacion[];
}

export interface CerrarConciliacionResponse {
  success: boolean;
  data: {
    procesadas: {
      facturaId: string;
      movimientoId: string;
      tipo: string;
      comentario?: string;
    }[];
    totalProcesadas: number;
  };
  message: string;
}

export interface ProviderGroup {
  _id: string;
  groupingFolio: string;
  totalAmount: number;
  providerRfc: string;
  providerName: string;
  branchName: string;
  companyProvider: string;
  bankNumber: string;
  debitedBankAccount: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalInvoices?: number;
  facturas: string[];
  referencia?: string;
  referenciaConciliacion?: string;
}

export interface GetProviderGroupsResponse {
  success: boolean;
  data: ProviderGroup[];
  message?: string;
}

export interface ConciliacionDirectaProviderRequest {
  providerGroupId: string;
  movimientoIds: string[];
  comentario?: string;
} 