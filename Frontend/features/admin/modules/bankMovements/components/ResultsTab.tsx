import React from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import {
  BankMovement,
  ConciliationData,
  ValidationResult,
} from "../types/validation";
import { formatMoney } from "@/utils";
import ConciliationCards from "./ConciliationCards";
import MovementsTable from "./MovementsTable";

interface ResultsTabProps {
  previewData: BankMovement[];
  previewHeaders: string[];
  conciliationData: ConciliationData;
  validacion: ValidationResult;
  loading: boolean;
  isImportDisabled: boolean;
  movementStats: {
    total: number;
    valid: number;
    withWarnings: number;
  };
  onImport: () => void;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  previewData,
  previewHeaders,
  conciliationData,
  validacion,
  loading,
  isImportDisabled,
  movementStats,
  onImport,
}) => {
  if (previewData.length === 0) {
    return null;
  }

  return (
    <>
      <ConciliationCards conciliationData={conciliationData} />

      <div className="my-4">
        {conciliationData.balancesCuadran === false && (
          <Alert variant="danger">
            <b>Importación Bloqueada:</b> La conciliación de saldos interna del
            archivo ha fallado. Revisa que el archivo de movimientos esté
            completo y no tenga errores.
          </Alert>
        )}

        {conciliationData.saldosInicialesCoinciden === false && (
          <Alert variant="danger">
            <b>Importación Bloqueada:</b> El saldo inicial del archivo (
            {formatMoney(conciliationData.saldoInicialCalculado)}) no coincide
            con el saldo actual de la cuenta (
            {formatMoney(conciliationData.saldoInicialCuenta)}). Asegúrate de
            estar importando el estado de cuenta correcto o ajusta el saldo de
            la cuenta si es necesario.
          </Alert>
        )}

        {validacion.advertenciaPrimeraFila && (
          <Alert variant="danger">{validacion.advertenciaPrimeraFila}</Alert>
        )}

        {validacion.advertenciasFilas &&
          validacion.advertenciasFilas.length > 0 && (
            <Alert variant="danger">
              <div>
                <b>Advertencias por filas:</b>
              </div>
              <ul>
                {validacion.advertenciasFilas.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </Alert>
          )}

        <div className="d-flex justify-content-between mb-2">
          <span>
            Total Filas: {movementStats.total} | Válidos: {movementStats.valid}{" "}
            | Con advertencia: {movementStats.withWarnings}
          </span>
          <Button
            onClick={onImport}
            variant="primary"
            disabled={loading || isImportDisabled}
          >
            {loading ? <Spinner size="sm" animation="border" /> : "Importar"}
          </Button>
        </div>

        <MovementsTable
          previewHeaders={previewHeaders}
          previewData={previewData}
        />
      </div>
    </>
  );
};

export default ResultsTab;
