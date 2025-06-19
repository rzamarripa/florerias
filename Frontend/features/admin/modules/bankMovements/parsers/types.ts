export interface MovimientoBancario {
  numero: number;
  fecha: Date | null;
  recibo: string;
  concepto: string;
  cargo: number;
  abono: number;
  saldo: number;
  advertencia?: string;
}
