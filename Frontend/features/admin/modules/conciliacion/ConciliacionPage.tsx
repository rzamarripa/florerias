"use client";

import React, { useState } from "react";
import { Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import {
  FiltrosConciliacion,
  ProviderGroupsTable,
  MovimientosTable,
  ConciliacionManualModal,
} from "./components";
import { useConciliacion } from "./hooks/useConciliacion";

export default function ConciliacionPage() {
  const {
    providerGroups,
    movimientos,
    loading,
    showModal,
    conciliacionesPendientes,
    providerGroupsRestantes,
    movimientosRestantes,
    selectedProviderGroups,
    selectedMovimiento,
    selectedMovimientos,
    loadData,
    handleProviderGroupSelect,
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
    if (selectedProviderGroups.length === 0) {
      alert("Debe seleccionar al menos un proveedor agrupado");
      return;
    }
    if (selectedMovimientos.length === 0) {
      alert("Debe seleccionar al menos un movimiento bancario");
      return;
    }

    handleConciliacionDirecta(selectedProviderGroups, selectedMovimientos);
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
              <ProviderGroupsTable
                providerGroups={providerGroups}
                selectedProviderGroups={selectedProviderGroups}
                onProviderGroupSelect={handleProviderGroupSelect}
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

          {(selectedProviderGroups.length > 0 ||
            selectedMovimientos.length > 0) && (
            <Row className="mt-3">
              <Col>
                <Alert variant="info">
                  Seleccionados: {selectedProviderGroups.length} proveedores
                  agrupados y {selectedMovimientos.length} movimientos
                </Alert>
              </Col>
            </Row>
          )}

          {selectedProviderGroups.length > 0 &&
            selectedMovimientos.length > 0 && (
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
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
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
        providerGroupsRestantes={providerGroupsRestantes}
        movimientosRestantes={movimientosRestantes}
        conciliacionesPendientes={conciliacionesPendientes}
        loading={loading}
        onConciliarManual={handleConciliacionManual}
        onCerrarConciliacion={handleCerrarConciliacion}
      />
    </div>
  );
}
