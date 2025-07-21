import { BankMovement, ValidationResult } from "../types/validation";
import { formatMoney } from "@/utils";

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

  // Ordenar movimientos cronológicamente (más antiguo primero)
  const movimientosOrdenados = [...parsedData].sort((a, b) => {
    const fechaA = new Date(a.fecha ?? '');
    const fechaB = new Date(b.fecha ?? '');
    return fechaA.getTime() - fechaB.getTime();
  });

  // El primer movimiento (más antiguo) define el saldo inicial
  const movimientoMasAntiguo = movimientosOrdenados[0];
  const saldoInicialArchivo = movimientoMasAntiguo.saldo;

  // El último movimiento (más reciente) define el saldo final
  const movimientoMasReciente = movimientosOrdenados[movimientosOrdenados.length - 1];
  const saldoFinalArchivo = movimientoMasReciente.saldo;

  let saldoCorriente = saldoInicialArchivo;

  const dataConSaldoCalculado = movimientosOrdenados.map((mov, idx) => {
    let saldoCalculado;
    if (idx === 0) {
      saldoCalculado = saldoCorriente;
    } else {
      saldoCalculado = saldoCorriente + mov.abono - mov.cargo;
    }

    const advertencia =
      Math.abs(saldoCalculado - mov.saldo) > 0.01
        ? `El saldo reportado (${formatMoney(
            mov.saldo
          )}) no coincide con el calculado (${formatMoney(saldoCalculado)})`
        : "";

    const result = {
      ...mov,
      saldoCalculado: saldoCalculado,
      advertencia: advertencia,
    };

    saldoCorriente = saldoCalculado;
    return result;
  });

  const saldoFinalCalculado =
    dataConSaldoCalculado.length > 0
      ? dataConSaldoCalculado[dataConSaldoCalculado.length - 1].saldoCalculado!
      : saldoInicialArchivo;

  const abonoPrimeraFila = movimientosOrdenados[0]?.abono
    ? Number(movimientosOrdenados[0].abono)
    : 0;

  const cargoPrimeraFila = movimientosOrdenados[0]?.cargo
    ? Number(movimientosOrdenados[0].cargo)
    : 0;

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
  saldoInicialCalculado: number,
  abonoPrimeraFila: number,
  cargoPrimeraFila: number
): boolean | null {
  if (saldoInicialCuenta === null) {
    return true;
  }

  const saldoActualCuentaCalculado =
    saldoInicialCuenta + abonoPrimeraFila - cargoPrimeraFila;

  return Math.abs(saldoActualCuentaCalculado - saldoInicialCalculado) < 0.01;
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

  const movimientosOrdenados = [...movimientos].sort((a, b) => {
    const fechaA = new Date(a.fecha ?? '');
    const fechaB = new Date(b.fecha ?? '');
    return fechaA.getTime() - fechaB.getTime();
  });

  const saldoInicialArchivo =
    round2(movimientosOrdenados[0]?.saldo ?? 0) || 0;
  const saldoFinalArchivo =
    round2(
      movimientosOrdenados[movimientosOrdenados.length - 1]?.saldo ?? 0
    ) || 0;

  const abonosRestantes = movimientosOrdenados
    .slice(1)
    .reduce((acc, mov) => acc + (Number(mov.abono) || 0), 0);
  const cargosRestantes = movimientosOrdenados
    .slice(1)
    .reduce((acc, mov) => acc + (Number(mov.cargo) || 0), 0);

  const saldoEsperado = round2(
    saldoInicialArchivo + abonosRestantes - cargosRestantes
  );

  const saldoCalculadoUltimaFila = round2(
    movimientosOrdenados[movimientosOrdenados.length - 1]?.saldoCalculado ?? 0
  );

  const saldoEsperadoCuadra = Math.abs(saldoEsperado - saldoFinalArchivo) < 0.01;
  const saldoCalculadoCuadra =
    Math.abs(saldoFinalArchivo - saldoCalculadoUltimaFila) < 0.01;

  let advertenciaPrimeraFila = null;
  if (saldoActualCuenta !== null && movimientosOrdenados.length > 0) {
    const abono1 = Number(movimientosOrdenados[0].abono) || 0;
    const cargo1 = Number(movimientosOrdenados[0].cargo) || 0;
    const saldoEsperadoPrimera = round2(saldoActualCuenta + abono1 - cargo1);
    if (
      Math.abs(saldoEsperadoPrimera - round2(movimientosOrdenados[0].saldo)) >
      0.01
    ) {
      advertenciaPrimeraFila = `El saldo reportado de la primera fila (${round2(
        movimientosOrdenados[0].saldo
      )}) no cuadra con el saldo actual de la cuenta (${saldoActualCuenta}) + abono (${abono1}) - cargo (${cargo1}) = ${saldoEsperadoPrimera}`;
    }
  }

  const advertenciasFilas = [];
  for (let i = 1; i < movimientosOrdenados.length; i++) {
    const prevSaldo = round2(movimientosOrdenados[i - 1].saldo);
    const abono = Number(movimientosOrdenados[i].abono) || 0;
    const cargo = Number(movimientosOrdenados[i].cargo) || 0;
    const esperado = round2(prevSaldo + abono - cargo);
    const reportado = round2(movimientosOrdenados[i].saldo);
    if (Math.abs(esperado - reportado) > 0.01) {
      advertenciasFilas.push(
        `Fila ${
          i + 1
        }: Saldo reportado (${reportado}) no cuadra con saldo anterior (${prevSaldo}) + abono (${abono}) - cargo (${cargo}) = ${esperado}`
      );
    }
  }

  return {
    saldoInicialArchivo,
    saldoFinalArchivo,
    saldoEsperado,
    totalAbonos: abonosRestantes,
    totalCargos: cargosRestantes,
    saldoCalculadoUltimaFila,
    saldoEsperadoCuadra,
    saldoCalculadoCuadra,
    valido:
      saldoEsperadoCuadra &&
      saldoCalculadoCuadra &&
      !advertenciaPrimeraFila &&
      advertenciasFilas.length === 0,
    movimientosOrdenados,
    advertenciaPrimeraFila,
    advertenciasFilas,
  };
} 