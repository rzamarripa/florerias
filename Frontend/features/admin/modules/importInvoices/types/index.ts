import { Company } from "../../companies/types";

export interface ImportedInvoice {
  _id: string;
  folioFiscalId: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  empresa: Pick<Company, '_id' | 'name' | 'rfc'>;
  rfcProveedorCertificacion: string;
  fechaEmision: string;
  fechaCertificacionSAT: string;
  fechaCancelacion?: string | null;
  importe: number;
  tipoComprobante: 'I' | 'E' | 'P';
  estatus: 0 | 1;
  createdAt: string;
  updatedAt: string;
  // Campos virtuales
  descripcionTipoComprobante?: string;
  descripcionEstatus?: string;
  estaCancelado?: boolean;
  estaVigente?: boolean;
}

export interface SummaryData {
  totalFacturas: number;
  facturasCanceladas: number;
  proveedoresUnicos: number;
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