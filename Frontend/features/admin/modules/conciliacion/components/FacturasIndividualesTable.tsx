"use client";

import React from "react";
import { Card, Table, Form, Row, Col, Button } from "react-bootstrap";
import { Undo2 } from "lucide-react";
import { formatCurrency } from "@/utils";

interface FacturasIndividualesTableProps {
  facturas: any[];
  selectedFacturas: string[];
  onFacturaSelect: (facturaId: string) => void;
  fechaFacturas?: string;
  onFechaFacturasChange?: (fecha: string) => void;
  readOnly?: boolean;
  title?: string;
  hideeDateFilter?: boolean;
  hideActions?: boolean;
  onEliminarConciliacion?: (facturaId: string) => void;
}

export default function FacturasIndividualesTable({
  facturas,
  selectedFacturas,
  onFacturaSelect,
  fechaFacturas,
  onFechaFacturasChange,
  readOnly = false,
  title = "Facturas Individuales (Estatus: Pagado y Autorizadas)",
  hideeDateFilter = false,
  hideActions = false,
  onEliminarConciliacion,
}: FacturasIndividualesTableProps) {
  return (
    <Card>
      <Card.Header>
        <Row className="align-items-center">
          <Col md={hideeDateFilter ? 12 : 6}>
            <h5 className="mb-0">{title}</h5>
            <small className="text-muted">
              Total: {facturas.length} {!readOnly && `| Seleccionadas: ${selectedFacturas.length}`}
            </small>
          </Col>
          {!hideeDateFilter && (
            <Col md={6}>
              <Form.Group className="mb-0">
                <Form.Label className="small mb-1">Fecha Facturas</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={fechaFacturas}
                  onChange={(e) => onFechaFacturasChange && onFechaFacturasChange(e.target.value)}
                />
              </Form.Group>
            </Col>
          )}
        </Row>
      </Card.Header>
      <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <Table striped bordered hover={!readOnly} size="sm">
          <thead>
            <tr>
              {!readOnly && (
                <th style={{ width: "50px" }}>
                  <Form.Check
                    type="checkbox"
                    checked={
                      selectedFacturas.length === facturas.length &&
                      facturas.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        facturas.forEach((factura) => {
                          if (!selectedFacturas.includes(factura._id)) {
                            onFacturaSelect(factura._id);
                          }
                        });
                      } else {
                        selectedFacturas.forEach((facturaId) => {
                          onFacturaSelect(facturaId);
                        });
                      }
                    }}
                  />
                </th>
              )}
              <th>UUID</th>
              <th>Emisor</th>
              <th>RFC Emisor</th>
              <th>Importe Pagado</th>
              <th>Folio</th>
              <th>Paquete</th>
              <th>Referencia</th>
              <th>Estado</th>
              {readOnly && !hideActions && onEliminarConciliacion && <th style={{ width: "100px" }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {facturas.map((factura, index) => (
              <tr
                key={`${factura._id}-${factura.packageId || factura.packageFolio || 'pkg'}-${factura.importePagado || 0}-${index}`}
className={""}
                style={{ cursor: readOnly ? "default" : "pointer" }}
                onClick={() => !readOnly && onFacturaSelect(factura._id)}
              >
                {!readOnly && (
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedFacturas.includes(factura._id)}
                      onChange={() => {}}
                    />
                  </td>
                )}
                <td className="text-truncate" style={{ maxWidth: "100px" }}>
                  <small>{factura.uuid?.substring(0, 8) || 'N/A'}...</small>
                </td>
                <td className="text-truncate" style={{ maxWidth: "150px" }}>
                  {factura.nombreEmisor}
                </td>
                <td>{factura.rfcEmisor}</td>
                <td>{formatCurrency(factura.importePagado || 0)}</td>
                <td>{factura.folio || '-'}</td>
                <td>#{factura.packageFolio}</td>
                <td>
                  {factura.numeroReferencia || factura.referencia ? (
                    <small className="text-primary font-monospace">
                      {factura.numeroReferencia || factura.referencia}
                    </small>
                  ) : (
                    <small className="text-muted">-</small>
                  )}
                </td>
                <td>
                  {readOnly || factura.coinciliado ? (
                    <small className="text-success">✅ Conciliada</small>
                  ) : (
                    <small className="text-warning">⏳ Pendiente</small>
                  )}
                </td>
                {readOnly && !hideActions && onEliminarConciliacion && (
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarConciliacion(factura._id);
                      }}
                      title="Revertir conciliación"
                    >
                      <Undo2 size={20} />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        {facturas.length === 0 && (
          <div className="text-center text-muted p-3">
            No hay facturas individuales disponibles para conciliar
          </div>
        )}
      </Card.Body>
    </Card>
  );
}