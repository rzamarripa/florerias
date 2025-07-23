import { useMemo } from "react";
import { BankMovement, ValidationResult } from "../types/validation";
import { validarYCalcularSaldos } from "../services/validationService";

interface UseMovementsValidationProps {
  previewData: BankMovement[];
  saldoInicialCuenta: number | null;
}

export function useMovementsValidation({
  previewData,
  saldoInicialCuenta,
}: UseMovementsValidationProps) {
  const validacion = useMemo((): ValidationResult => {
    return validarYCalcularSaldos(previewData, saldoInicialCuenta);
  }, [previewData, saldoInicialCuenta]);

  const isImportDisabled = useMemo(() => {
    if (!previewData.length) return true;

    const validMovements = previewData.filter((d) => !d.advertencia);
    if (validMovements.length === 0) return true;

    if (!validacion.valido) return true;

    return false;
  }, [previewData, validacion.valido]);

  const movementStats = useMemo(() => {
    const total = previewData.length;
    const valid = previewData.filter((d) => !d.advertencia).length;
    const withWarnings = previewData.filter((d) => d.advertencia).length;

    return {
      total,
      valid,
      withWarnings,
    };
  }, [previewData]);

  return {
    validacion,
    isImportDisabled,
    movementStats,
  };
}
