export interface BankMovement {
  numero?: number;
  fecha: Date | string | null;
  recibo: string;
  concepto: string;
  cargo: number;
  abono: number;
  saldo: number;
  saldoCalculado?: number;
  advertencia?: string;
}

export interface ValidationResult {
  saldoInicialArchivo: number;
  saldoFinalArchivo: number;
  saldoEsperado: number;
  totalAbonos: number;
  totalCargos: number;
  saldoCalculadoUltimaFila: number;
  saldoEsperadoCuadra: boolean;
  saldoCalculadoCuadra: boolean;
  valido: boolean;
  movimientosOrdenados: BankMovement[];
  advertenciaPrimeraFila: string | null;
  advertenciasFilas: string[];
}

export interface ConciliationData {
  saldoInicialCuenta: number | null;
  saldoInicialCalculado: number | null;
  saldoFinalCalculado: number | null;
  saldoFinalReportado: number | null;
  abonoPrimeraFila: number | null;
  cargoPrimeraFila: number | null;
  balancesCuadran: boolean | null;
  saldosInicialesCoinciden: boolean | null;
}

export interface ImportConfig {
  selectedCompany: string;
  selectedBankAccount: string;
  file: File | null;
  selectedBank: string;
  parserWarning: string;
}

export interface Company {
  _id: string;
  name: string;
}

export interface BankAccount {
  _id: string;
  accountNumber: string;
  currentBalance: number;
  bank: {
    _id: string;
    name: string;
  };
} 