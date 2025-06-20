import { Company } from "../../companies/types";

export interface ImportedInvoice {
  _id: string;
  fiscalFolioId: string;
  issuerTaxId: string;
  issuerName: string;
  receiverTaxId: string;
  company: Pick<Company, '_id' | 'name' | 'rfc'>;
  certificationProviderId: string;
  issuanceDate: string;
  taxAuthorityCertificationDate: string;
  cancellationDate?: string | null;
  amount: number;
  voucherType: 'I' | 'E' | 'P';
  status: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryData {
  totalInvoices: number;
  cancelledInvoices: number;
  uniqueProviders: number;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// Data format from the parsed ZIP file's .txt
export interface RawInvoiceData {
  Uuid: string;
  RfcEmisor: string;
  NombreEmisor: string;
  RfcReceptor: string;
  NombreReceptor: string;
  RfcPac: string;
  FechaEmision: string;
  FechaCertificacionSat: string;
  Monto: string;
  EfectoComprobante: 'I' | 'E' | 'P';
  Estatus: '0' | '1';
  FechaCancelacion: string;
} 