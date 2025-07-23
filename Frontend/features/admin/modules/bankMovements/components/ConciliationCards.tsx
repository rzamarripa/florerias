import React from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Card, Col, Row } from "react-bootstrap";
import CountUp from "react-countup";
import { ConciliationData } from "../types/validation";
import { formatMoney } from "@/utils";

interface ConciliationCardsProps {
  conciliationData: ConciliationData;
}

const ConciliationCards: React.FC<ConciliationCardsProps> = ({
  conciliationData,
}) => {
  const {
    saldoInicialCuenta,
    saldoInicialCalculado,
    saldoFinalCalculado,
    saldoFinalReportado,
    abonoPrimeraFila,
    cargoPrimeraFila,
    balancesCuadran,
    saldosInicialesCoinciden,
  } = conciliationData;

  return (
    <Row className="g-3 mb-3">
      <Col xl={4}>
        <Card className="border-0 bg-light shadow-none mb-0">
          <Card.Body>
            <h5 title="Saldo Inicial Calculado del Archivo">
              Saldo Inicial (Calculado)
            </h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span className="avatar-title bg-soft-primary text-primary rounded-circle fs-22">
                  <ArrowRight />
                </span>
              </div>
              <h3 className="mb-0">
                <CountUp
                  start={0}
                  end={saldoInicialCalculado ?? 0}
                  duration={1}
                  separator=","
                  prefix="$"
                  decimals={2}
                />
              </h3>
            </div>
            {saldoInicialCuenta !== null &&
            saldosInicialesCoinciden !== null ? (
              <p className="mb-0 d-flex justify-content-between">
                <span className="text-nowrap text-muted">
                  Saldo Registrado:{" "}
                  <span
                    className={`fw-bold ${
                      saldosInicialesCoinciden ? "text-success" : "text-danger"
                    }`}
                  >
                    {saldosInicialesCoinciden ? "Coincide" : "No Coincide"}
                  </span>
                </span>
                <span className="fw-bold text-end">
                  Saldo Actual: {formatMoney(saldoInicialCuenta ?? 0)}
                  <br />
                  (+) Abono: {formatMoney(abonoPrimeraFila ?? 0)}
                  <br />
                  (-) Cargo: {formatMoney(cargoPrimeraFila ?? 0)}
                  <br />
                  {formatMoney(
                    (saldoInicialCuenta ?? 0) +
                      (abonoPrimeraFila ?? 0) -
                      (cargoPrimeraFila ?? 0)
                  )}
                </span>
              </p>
            ) : (
              <p className="mb-0 text-muted fst-italic">
                No hay saldo inicial para comparar.
              </p>
            )}
          </Card.Body>
        </Card>
      </Col>
      <Col xl={4}>
        <Card
          className={`border-0 bg-${
            balancesCuadran ? "success" : "danger"
          } bg-opacity-10 shadow-none mb-0`}
        >
          <Card.Body>
            <h5 title="Resultado de la Conciliación">Conciliación</h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span
                  className={`avatar-title text-bg-${
                    balancesCuadran ? "success" : "danger"
                  } bg-opacity-90 rounded-circle fs-22`}
                >
                  {balancesCuadran ? <Check /> : <X />}
                </span>
              </div>
              <h3 className="mb-0">
                {balancesCuadran ? "CUADRA" : "NO CUADRA"}
              </h3>
            </div>
            <p className="mb-0 d-flex justify-content-between">
              <span className="text-muted">Diferencia</span>
              <span className="fw-bold">
                {formatMoney(
                  Math.abs(
                    (saldoFinalCalculado ?? 0) - (saldoFinalReportado ?? 0)
                  )
                )}
              </span>
            </p>
          </Card.Body>
        </Card>
      </Col>
      <Col xl={4}>
        <Card className="border-0 bg-light shadow-none mb-0">
          <Card.Body>
            <h5 title="Saldo Final Calculado">Saldo Final (Calculado)</h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span className="avatar-title bg-soft-primary text-primary rounded-circle fs-22">
                  <ArrowLeft />
                </span>
              </div>
              <h3 className="mb-0">
                <CountUp
                  start={0}
                  end={saldoFinalCalculado ?? 0}
                  duration={1}
                  separator=","
                  prefix="$"
                  decimals={2}
                />
              </h3>
            </div>
            <p className="mb-0 d-flex justify-content-between">
              <span className="text-nowrap text-muted">Saldo Reportado</span>
              <span className="fw-bold">
                {formatMoney(saldoFinalReportado)}
              </span>
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ConciliationCards;
