"use client";

import React from "react";
import { Card, Table, Form } from "react-bootstrap";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MovimientoBancario } from "../types";
import { formatCurrency } from "@/utils";

interface MovimientosTableProps {
  movimientos: MovimientoBancario[];
  selectedMovimiento: string;
  selectedMovimientos: string[];
  onMovimientoSelect: (movimientoId: string) => void;
  onMovimientosSelect: (movimientoId: string) => void;
}

export default function MovimientosTable({
  movimientos,
  selectedMovimiento, // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedMovimientos,
  onMovimientoSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
  onMovimientosSelect,
}: MovimientosTableProps) {
  return (
    <Card>
      <Card.Header>
        <h5>Movimientos Bancarios</h5>
        <small className="text-muted">
          Total: {movimientos.length} | Seleccionados:{" "}
          {selectedMovimientos.length}
        </small>
      </Card.Header>
      <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>
                <Form.Check
                  type="checkbox"
                  checked={
                    selectedMovimientos.length === movimientos.length &&
                    movimientos.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      movimientos.forEach((mov) => {
                        if (!selectedMovimientos.includes(mov._id)) {
                          onMovimientosSelect(mov._id);
                        }
                      });
                    } else {
                      selectedMovimientos.forEach((movId) => {
                        onMovimientosSelect(movId);
                      });
                    }
                  }}
                />
              </th>
              <th>Concepto</th>
              <th>Cargo</th>
              <th>Abono</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento) => (
              <tr
                key={movimiento._id}
                className={
                  selectedMovimientos.includes(movimiento._id)
                    ? "table-active"
                    : ""
                }
                style={{ cursor: "pointer" }}
                onClick={() => {
                  onMovimientosSelect(movimiento._id);
                }}
              >
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedMovimientos.includes(movimiento._id)}
                    onChange={() => {}}
                  />
                </td>
                <td className="text-truncate" style={{ maxWidth: "150px" }}>
                  {movimiento.concepto}
                </td>
                <td>{formatCurrency(movimiento.cargo)}</td>
                <td>{formatCurrency(movimiento.abono)}</td>
                <td>
                  {format(new Date(movimiento.fecha), "dd/MM/yyyy", {
                    locale: es,
                  })}
                </td>
                <td>
                  {movimiento.coinciliado ? (
                    <div>
                      <small className="text-success">✅ Conciliado</small>
                      {movimiento.referenciaConciliacion && (
                        <div>
                          <small className="text-muted">
                            Ref:{" "}
                            {movimiento.referenciaConciliacion.substring(0, 8)}
                            ...
                          </small>
                        </div>
                      )}
                    </div>
                  ) : (
                    <small className="text-warning">⏳ Pendiente</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {movimientos.length === 0 && (
          <div className="text-center text-muted p-3">
            No hay movimientos bancarios disponibles para conciliar
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
