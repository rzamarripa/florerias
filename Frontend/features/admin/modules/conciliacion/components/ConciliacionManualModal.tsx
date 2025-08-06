"use client";

import React, { useState } from "react";
import {
  Modal,
  Alert,
  Row,
  Col,
  Table,
  Form,
  Button,
  Spinner,
} from "react-bootstrap";
import { ProviderGroup, MovimientoBancario, Conciliacion } from "../types";
import { formatCurrency } from "@/utils";

interface ConciliacionManualModalProps {
  show: boolean;
  onHide: () => void;
  providerGroupsRestantes: ProviderGroup[];
  movimientosRestantes: MovimientoBancario[];
  conciliacionesPendientes: Conciliacion[];
  loading: boolean;
  onConciliarManual: (
    providerGroupId: string,
    movimientoId: string,
    comentario: string
  ) => void;
  onCerrarConciliacion: () => void;
}

export default function ConciliacionManualModal({
  show,
  onHide,
  providerGroupsRestantes,
  movimientosRestantes,
  conciliacionesPendientes,
  loading,
  onConciliarManual,
  onCerrarConciliacion,
}: ConciliacionManualModalProps) {
  const [selectedProviderGroup, setSelectedProviderGroup] =
    useState<string>("");
  const [selectedMovimiento, setSelectedMovimiento] = useState<string>("");
  const [comentario, setComentario] = useState<string>("");

  const handleConciliarManual = () => {
    if (!selectedProviderGroup || !selectedMovimiento) {
      alert(
        "Debe seleccionar un proveedor agrupado y un movimiento para conciliar manualmente."
      );
      return;
    }

    onConciliarManual(selectedProviderGroup, selectedMovimiento, comentario);
    setSelectedProviderGroup("");
    setSelectedMovimiento("");
    setComentario("");
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Conciliación Manual</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info">
          Se completó la conciliación automática. Los elementos restantes
          requieren conciliación manual.
        </Alert>

        {conciliacionesPendientes.length > 0 && (
          <div className="mb-3">
            <h6>
              Conciliaciones Procesadas: {conciliacionesPendientes.length}
            </h6>
          </div>
        )}

        <Row className="mb-3">
          <Col md={6}>
            <h6>Proveedores Restantes ({providerGroupsRestantes.length})</h6>
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #dee2e6",
                borderRadius: "0.25rem",
              }}
            >
              <Table striped hover size="sm" className="mb-0">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Total</th>
                    <th>Facturas</th>
                  </tr>
                </thead>
                <tbody>
                  {providerGroupsRestantes.map((providerGroup) => (
                    <tr
                      key={providerGroup._id}
                      className={
                        selectedProviderGroup === providerGroup._id
                          ? "table-active"
                          : ""
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelectedProviderGroup(
                          selectedProviderGroup === providerGroup._id
                            ? ""
                            : providerGroup._id
                        )
                      }
                    >
                      <td>
                        <Form.Check
                          type="radio"
                          name="providerGroupManual"
                          checked={selectedProviderGroup === providerGroup._id}
                          onChange={() => {}}
                        />
                      </td>
                      <td>{providerGroup.providerName}</td>
                      <td>{formatCurrency(providerGroup.totalAmount)}</td>
                      <td>
                        <span className="badge bg-info">
                          {providerGroup.totalInvoices}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
          <Col md={6}>
            <h6>Movimientos Restantes ({movimientosRestantes.length})</h6>
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #dee2e6",
                borderRadius: "0.25rem",
              }}
            >
              <Table striped hover size="sm" className="mb-0">
                <tbody>
                  {movimientosRestantes.map((movimiento) => (
                    <tr
                      key={movimiento._id}
                      className={
                        selectedMovimiento === movimiento._id
                          ? "table-active"
                          : ""
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelectedMovimiento(
                          selectedMovimiento === movimiento._id
                            ? ""
                            : movimiento._id
                        )
                      }
                    >
                      <td>
                        <Form.Check
                          type="radio"
                          name="movimientoManual"
                          checked={selectedMovimiento === movimiento._id}
                          onChange={() => {}}
                        />
                      </td>
                      <td>{movimiento.referencia || "N/A"}</td>
                      <td>{formatCurrency(movimiento.abono)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Comentario</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ingrese el motivo de la conciliación manual"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Button
              variant="secondary"
              onClick={handleConciliarManual}
              disabled={!selectedProviderGroup || !selectedMovimiento}
              className="me-2"
            >
              Conciliar Selección
            </Button>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={onCerrarConciliacion}
          disabled={loading || conciliacionesPendientes.length === 0}
        >
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            "Cerrar Conciliación"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
