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
import { Factura, MovimientoBancario, Conciliacion } from "../types";
import { formatCurrency } from "@/utils";

interface ConciliacionManualModalProps {
  show: boolean;
  onHide: () => void;
  facturasRestantes: Factura[];
  movimientosRestantes: MovimientoBancario[];
  conciliacionesPendientes: Conciliacion[];
  loading: boolean;
  onConciliarManual: (
    facturaId: string,
    movimientoId: string,
    comentario: string
  ) => void;
  onCerrarConciliacion: () => void;
}

export default function ConciliacionManualModal({
  show,
  onHide,
  facturasRestantes,
  movimientosRestantes,
  conciliacionesPendientes,
  loading,
  onConciliarManual,
  onCerrarConciliacion,
}: ConciliacionManualModalProps) {
  const [selectedFactura, setSelectedFactura] = useState<string>("");
  const [selectedMovimiento, setSelectedMovimiento] = useState<string>("");
  const [comentario, setComentario] = useState<string>("");

  const handleConciliarManual = () => {
    if (!selectedFactura || !selectedMovimiento) {
      alert(
        "Debe seleccionar una factura y un movimiento para conciliar manualmente."
      );
      return;
    }

    onConciliarManual(selectedFactura, selectedMovimiento, comentario);
    setSelectedFactura("");
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
            <h6>Facturas Restantes ({facturasRestantes.length})</h6>
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
                  {facturasRestantes.map((factura) => (
                    <tr
                      key={factura._id}
                      className={
                        selectedFactura === factura._id ? "table-active" : ""
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelectedFactura(
                          selectedFactura === factura._id ? "" : factura._id
                        )
                      }
                    >
                      <td>
                        <Form.Check
                          type="radio"
                          name="facturaManual"
                          checked={selectedFactura === factura._id}
                          onChange={() => {}}
                        />
                      </td>
                      <td>{factura.numeroReferencia || "N/A"}</td>
                      <td>{formatCurrency(factura.importeAPagar)}</td>
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
                      <td>
                        {movimiento.numeroReferencia ||
                          movimiento.referencia ||
                          "N/A"}
                      </td>
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
              disabled={!selectedFactura || !selectedMovimiento}
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
