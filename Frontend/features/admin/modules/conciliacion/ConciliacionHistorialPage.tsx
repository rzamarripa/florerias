"use client";

import React, { useState } from "react";
import { Row, Col, Button, Spinner, Form } from "react-bootstrap";
import {
  FiltrosConciliacion,
  ProviderGroupsTable,
  FacturasIndividualesTable,
} from "./components";
import { useConciliacionHistorial } from "./hooks/useConciliacionHistorial";

export default function ConciliacionHistorialPage() {
  const {
    providerGroups,
    facturasIndividuales,
    loading,
    layoutType,
    fechaFacturas,
    loadAllData,
    handleLayoutTypeChange,
    handleFechaFacturasChange,
    handleEliminarConciliacion,
  } = useConciliacionHistorial();

  const [hasData, setHasData] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<{
    companyId: string;
    bankAccountId: string;
  } | null>(null);

  const handleLoadData = (filters: {
    companyId: string;
    bankAccountId: string;
  }) => {
    setCurrentFilters(filters);
    loadAllData(filters);
    setHasData(true);
  };

  // Recargar datos cuando cambie la fecha o el tipo de layout
  React.useEffect(() => {
    if (currentFilters && hasData) {
      loadAllData(currentFilters);
    }
  }, [fechaFacturas, layoutType, currentFilters, hasData, loadAllData]);

  return (
    <div className="container-fluid">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Historial de Conciliaciones</h2>
            <Button 
              variant="outline-secondary" 
              onClick={() => window.history.back()}
              size="sm"
            >
              ← Volver a Conciliación
            </Button>
          </div>
          <p className="text-muted">
            Visualiza todas las facturas y agrupaciones que han sido conciliadas exitosamente.
          </p>
        </Col>
      </Row>

      <FiltrosConciliacion
        onLoadData={handleLoadData}
        onLayoutTypeChange={handleLayoutTypeChange}
        layoutType={layoutType}
        loading={loading}
        fechaFacturas={fechaFacturas}
        fechaMovimientos={fechaFacturas}
        hideMovimientosDate={true}
        hideButtons={false}
      />

      {hasData && (
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Fecha de Conciliación</Form.Label>
              <Form.Control
                type="date"
                value={fechaFacturas}
                onChange={(e) => handleFechaFacturasChange(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
      )}

      {hasData && (
        <Row>
          <Col md={12}>
            {layoutType === 'grouped' ? (
              <ProviderGroupsTable
                providerGroups={providerGroups}
                selectedProviderGroups={[]}
                onProviderGroupSelect={() => {}} // Sin funcionalidad de selección
                readOnly={true}
                title="Agrupaciones Conciliadas"
                hideeDateFilter={true}
                onEliminarConciliacion={(id) => handleEliminarConciliacion(id, 'grouped')}
              />
            ) : (
              <FacturasIndividualesTable
                facturas={facturasIndividuales}
                selectedFacturas={[]}
                onFacturaSelect={() => {}} // Sin funcionalidad de selección
                readOnly={true}
                title="Facturas Individuales Conciliadas"
                hideeDateFilter={true}
                onEliminarConciliacion={(id) => handleEliminarConciliacion(id, 'individual')}
              />
            )}
          </Col>
        </Row>
      )}

      {loading && (
        <Row>
          <Col>
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">Cargando historial de conciliaciones...</p>
            </div>
          </Col>
        </Row>
      )}

      {hasData && providerGroups.length === 0 && facturasIndividuales.length === 0 && (
        <Row>
          <Col>
            <div className="text-center p-5 bg-light rounded">
              <h5 className="text-muted">No hay conciliaciones para mostrar</h5>
              <p className="text-muted">
                No se encontraron elementos conciliados para los filtros seleccionados.
              </p>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
}