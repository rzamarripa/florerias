"use client";

import React, { useState } from "react";
import { Row, Col } from "react-bootstrap";
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
    loadData,
    handleFacturaSelect,
    handleMovimientoSelect,
    handleConciliarAutomatico,
    handleConciliacionManual,
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
              onMovimientoSelect={handleMovimientoSelect}
            />
          </Col>
        </Row>
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
