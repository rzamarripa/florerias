import { BankMovement, ValidationResult } from "../types/validation";

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function processMovementsWithCalculatedBalance(
  parsedData: BankMovement[]
): {
  dataConSaldoCalculado: BankMovement[];
  saldoInicialArchivo: number;
  saldoFinalArchivo: number;
  saldoFinalCalculado: number;
  abonoPrimeraFila: number;
  cargoPrimeraFila: number;
} {
  if (parsedData.length === 0) {
    return {
      dataConSaldoCalculado: [],
      saldoInicialArchivo: 0,
      saldoFinalArchivo: 0,
      saldoFinalCalculado: 0,
      abonoPrimeraFila: 0,
      cargoPrimeraFila: 0,
    };
  }

  const primerMovimiento = parsedData[0];
  const ultimoMovimiento = parsedData[parsedData.length - 1];

  const saldoFinalArchivo = primerMovimiento.saldo;
  const saldoInicialArchivo = ultimoMovimiento.saldo - ultimoMovimiento.abono + ultimoMovimiento.cargo;

  const dataConSaldoCalculado = parsedData.map((mov) => {
    return {
      ...mov,
      saldoCalculado: mov.saldo,
      advertencia: "",
    };
  });

  const saldoFinalCalculado = saldoFinalArchivo;

  const abonoPrimeraFila = ultimoMovimiento?.abono || 0;
  const cargoPrimeraFila = ultimoMovimiento?.cargo || 0;

  return {
    dataConSaldoCalculado,
    saldoInicialArchivo,
    saldoFinalArchivo,
    saldoFinalCalculado,
    abonoPrimeraFila,
    cargoPrimeraFila,
  };
}

export function validateBalances(
  saldoInicialCuenta: number | null,
  saldoInicialArchivo: number,
  abonoPrimeraFila: number,
  cargoPrimeraFila: number
): boolean | null {
  if (saldoInicialCuenta === null) {
    return true;
  }

  return (
    Math.abs(
      saldoInicialArchivo -
        (saldoInicialCuenta + abonoPrimeraFila - cargoPrimeraFila)
    ) < 0.01
  );
}

export function validateConciliation(
  saldoInicialCuenta: number | null,
  saldoFinalCalculado: number
): boolean | null {
  if (saldoInicialCuenta === null) {
    return true;
  }

  return Math.abs(saldoInicialCuenta - saldoFinalCalculado) < 0.01;
}

export function validarYCalcularSaldos(
  movimientos: BankMovement[],
  saldoActualCuenta: number | null
): ValidationResult {
  if (!movimientos || movimientos.length === 0) {
    return {
      saldoInicialArchivo: 0,
      saldoFinalArchivo: 0,
      saldoEsperado: 0,
      totalAbonos: 0,
      totalCargos: 0,
      saldoCalculadoUltimaFila: 0,
      saldoEsperadoCuadra: false,
      saldoCalculadoCuadra: false,
      valido: false,
      movimientosOrdenados: [],
      advertenciaPrimeraFila: null,
      advertenciasFilas: [],
    };
  }

  const primerMovimiento = movimientos[0];
  const ultimoMovimiento = movimientos[movimientos.length - 1];

  const saldoInicialArchivo = round2(ultimoMovimiento.saldo - ultimoMovimiento.abono + ultimoMovimiento.cargo);
  const saldoFinalArchivo = round2(primerMovimiento.saldo);

  const totalAbonos = movimientos.reduce((acc, mov) => acc + (Number(mov.abono) || 0), 0);
  const totalCargos = movimientos.reduce((acc, mov) => acc + (Number(mov.cargo) || 0), 0);

  let advertenciaPrimeraFila = null;
  let valido = true;

  if (saldoActualCuenta !== null) {
    if (Math.abs(saldoActualCuenta - saldoInicialArchivo) > 0.01) {
      advertenciaPrimeraFila = `El saldo actual de la cuenta (${saldoActualCuenta}) no coincide con el saldo inicial del archivo (${saldoInicialArchivo})`;
      valido = false;
    }
  }

  const advertenciasFilas: string[] = [];

  const movimientosOrdenados = [...movimientos].sort((a, b) => {
    const fechaA = new Date(a.fecha ?? '');
    const fechaB = new Date(b.fecha ?? '');
    return fechaA.getTime() - fechaB.getTime();
  });

  return {
    saldoInicialArchivo,
    saldoFinalArchivo,
    saldoEsperado: saldoFinalArchivo,
    totalAbonos,
    totalCargos,
    saldoCalculadoUltimaFila: saldoFinalArchivo,
    saldoEsperadoCuadra: true,
    saldoCalculadoCuadra: true,
    valido,
    movimientosOrdenados,
    advertenciaPrimeraFila,
    advertenciasFilas,
  };
} 