"use client";

import React, { useState } from "react";
import { Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import {
  FiltrosConciliacion,
  FacturasTable,
  MovimientosTable,
  ConciliacionManualModal,
} from "./components";
import { useConciliacion } from "./hooks/useConciliacion";

export default function ConciliacionPage() {
  const {
    facturas,
    movimientos,
    loading,
    showModal,
    conciliacionesPendientes,
    facturasRestantes,
    movimientosRestantes,
    selectedFactura,
    selectedMovimiento,
    selectedMovimientos,
    loadData,
    handleFacturaSelect,
    handleMovimientoSelect,
    handleMovimientosSelect,
    handleConciliarAutomatico,
    handleConciliacionManual,
    handleConciliacionDirecta,
    handleCerrarConciliacion,
    resetModal,
  } = useConciliacion();

  const [hasData, setHasData] = useState<boolean>(false);

  const handleFiltersChange = (filters: {
    companyId: string;
    bankAccountId: string;
    fecha: string;
  }) => {
    loadData(filters);
    setHasData(true);
  };

  const handleConciliar = (filters: {
    companyId: string;
    bankAccountId: string;
    fecha: string;
  }) => {
    handleConciliarAutomatico(filters);
  };

  const handleConciliarDirectamente = () => {
    if (!selectedFactura) {
      alert("Debe seleccionar una factura");
      return;
    }
    if (selectedMovimientos.length === 0) {
      alert("Debe seleccionar al menos un movimiento bancario");
      return;
    }

    handleConciliacionDirecta(selectedFactura, selectedMovimientos);
  };

  return (
    <div className="container-fluid">
      <Row className="mb-4">
        <Col>
          <h2>Conciliación Bancaria</h2>
        </Col>
      </Row>

      <FiltrosConciliacion
        onFiltersChange={handleFiltersChange}
        onConciliar={handleConciliar}
        loading={loading}
      />

      {hasData && (
        <>
          <Row>
            <Col md={6}>
              <FacturasTable
                facturas={facturas}
                selectedFactura={selectedFactura}
                onFacturaSelect={handleFacturaSelect}
              />
            </Col>

            <Col md={6}>
              <MovimientosTable
                movimientos={movimientos}
                selectedMovimiento={selectedMovimiento}
                selectedMovimientos={selectedMovimientos}
                onMovimientoSelect={handleMovimientoSelect}
                onMovimientosSelect={handleMovimientosSelect}
              />
            </Col>
          </Row>

          {(selectedFactura || selectedMovimientos.length > 0) && (
            <Row className="mt-3">
              <Col>
                <Alert variant="info">
                  Seleccionados: {selectedFactura ? "1 factura" : "0 facturas"}{" "}
                  y {selectedMovimientos.length} movimientos
                </Alert>
              </Col>
            </Row>
          )}

          {selectedFactura && selectedMovimientos.length > 0 && (
            <Row className="mt-2">
              <Col>
                <Button
                  variant="success"
                  onClick={handleConciliarDirectamente}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Conciliando...
                    </>
                  ) : (
                    "Conciliar Selección"
                  )}
                </Button>
              </Col>
            </Row>
          )}
        </>
      )}

      <ConciliacionManualModal
        show={showModal}
        onHide={resetModal}
        facturasRestantes={facturasRestantes}
        movimientosRestantes={movimientosRestantes}
        conciliacionesPendientes={conciliacionesPendientes}
        loading={loading}
        onConciliarManual={handleConciliacionManual}
        onCerrarConciliacion={handleCerrarConciliacion}
      />
    </div>
  );
}
