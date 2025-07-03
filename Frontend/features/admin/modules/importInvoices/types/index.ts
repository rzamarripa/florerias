import { Company } from "../../companies/types";

export interface ImportedInvoice {
  _id: string;
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  empresa: Pick<Company, '_id' | 'name' | 'rfc'>;
  rfcProveedorCertificacion: string;
  fechaEmision: string;
  fechaCertificacionSAT: string;
  fechaCancelacion?: string | null;
  importeAPagar: number;
  importePagado: number;
  tipoComprobante: 'I' | 'E' | 'P';
  estatus: 0 | 1;
  estadoPago: 0 | 1 | 2 | 3;
  createdAt: string;
  updatedAt: string;
  // Campos virtuales
  descripcionTipoComprobante?: string;
  descripcionEstatus?: string;
  estaCancelado?: boolean;
  estaVigente?: boolean;
  saldo?: number;
  porcentajePagado?: number;
  descripcionEstadoPago?: string;
  // Campos adicionales
  folio?: string;
  serie?: string;
  formaPago?: string;
  metodoPago?: string;
  esCompleta?: boolean;
  descripcionPago?: string;
  autorizada?: boolean;
  pagoRechazado?: boolean;
  fechaRevision?: string;
  registrado?: number;
  pagado?: number;
  fiestatus?: string;
  estaRegistrada?: boolean;
  motivoDescuento?: string;
  descuento?: number;
  // Nuevo campo para concepto de gasto
  conceptoGasto?: string;
}

export interface SummaryData {
  totalFacturas: number;
  facturasCanceladas: number;
  proveedoresUnicos: number;
  totalImporteAPagar?: number;
  totalPagado?: number;
  totalSaldo?: number;
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