"use client";

import React, { useState } from "react";
import { Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { useRouter } from "next/navigation";
import {
  FiltrosConciliacion,
  ProviderGroupsTable,
  FacturasIndividualesTable,
  MovimientosTable,
  ConciliacionManualModal,
} from "./components";
import { useConciliacion } from "./hooks/useConciliacion";

export default function ConciliacionPage() {
  const router = useRouter();
  const {
    providerGroups,
    facturasIndividuales,
    movimientos,
    loading,
    showModal,
    conciliacionesPendientes,
    providerGroupsRestantes,
    movimientosRestantes,
    selectedProviderGroups,
    selectedFacturasIndividuales,
    selectedMovimiento,
    selectedMovimientos,
    layoutType,
    fechaFacturas,
    fechaMovimientos,
    loadAllData,
    handleProviderGroupSelect,
    handleFacturaIndividualSelect,
    handleMovimientoSelect,
    handleMovimientosSelect,
    handleLayoutTypeChange,
    handleFechaFacturasChange,
    handleFechaMovimientosChange,
    handleConciliacionManual,
    handleConciliacionDirecta,
    handleCerrarConciliacion,
    resetModal,
  } = useConciliacion();

  const [hasData, setHasData] = useState<boolean>(false);

  const handleLoadData = (filters: {
    companyId: string;
    bankAccountId: string;
  }) => {
    loadAllData(filters);
    setHasData(true);
  };


  const handleConciliarDirectamente = () => {
    // Las validaciones ya se manejan en el hook useConciliacion con toasts
    handleConciliacionDirecta(selectedProviderGroups, selectedMovimientos);
  };

  return (
    <div className="container-fluid">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Conciliación Bancaria</h2>
            <Button 
              variant="outline-info" 
              onClick={() => router.push('/modulos/conciliacion/historial')}
              size="sm"
            >
              📋 Ver Historial de Conciliaciones
            </Button>
          </div>
        </Col>
      </Row>

      <FiltrosConciliacion
        onLoadData={handleLoadData}
        onLayoutTypeChange={handleLayoutTypeChange}
        layoutType={layoutType}
        loading={loading}
        fechaFacturas={fechaFacturas}
        fechaMovimientos={fechaMovimientos}
      />

      {hasData && (
        <>
          {/* Botón de Conciliar Selección */}
          {((layoutType === 'grouped' && selectedProviderGroups.length > 0) ||
            (layoutType === 'individual' && selectedFacturasIndividuales.length > 0)) &&
            selectedMovimientos.length > 0 && (
              <Row className="mb-3">
                <Col>
                  <div className="d-flex gap-3 align-items-center">
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
                    <Alert variant="info" className="mb-0">
                      Seleccionados:{" "}
                      {layoutType === 'grouped' 
                        ? `${selectedProviderGroups.length} proveedores agrupados`
                        : `${selectedFacturasIndividuales.length} facturas individuales`
                      } y {selectedMovimientos.length} movimientos
                    </Alert>
                  </div>
                </Col>
              </Row>
            )}

          <Row>
            <Col md={6}>
              {layoutType === 'grouped' ? (
                <ProviderGroupsTable
                  providerGroups={providerGroups}
                  selectedProviderGroups={selectedProviderGroups}
                  onProviderGroupSelect={handleProviderGroupSelect}
                  fechaFacturas={fechaFacturas}
                  onFechaFacturasChange={handleFechaFacturasChange}
                />
              ) : (
                <FacturasIndividualesTable
                  facturas={facturasIndividuales}
                  selectedFacturas={selectedFacturasIndividuales}
                  onFacturaSelect={handleFacturaIndividualSelect}
                  fechaFacturas={fechaFacturas}
                  onFechaFacturasChange={handleFechaFacturasChange}
                />
              )}
            </Col>

            <Col md={6}>
              <MovimientosTable
                movimientos={movimientos}
                selectedMovimiento={selectedMovimiento}
                selectedMovimientos={selectedMovimientos}
                onMovimientoSelect={handleMovimientoSelect}
                onMovimientosSelect={handleMovimientosSelect}
                fechaMovimientos={fechaMovimientos}
                onFechaMovimientosChange={handleFechaMovimientosChange}
              />
            </Col>
          </Row>

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
