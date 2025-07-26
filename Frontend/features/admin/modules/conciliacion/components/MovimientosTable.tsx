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
  onMovimientoSelect: (movimientoId: string) => void;
}

export default function MovimientosTable({
  movimientos,
  selectedMovimiento,
  onMovimientoSelect,
}: MovimientosTableProps) {
  return (
    <Card>
      <Card.Header>
        <h5>Movimientos Bancarios</h5>
        <small className="text-muted">Total: {movimientos.length}</small>
      </Card.Header>
      <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th></th>
              <th>Referencia</th>
              <th>Concepto</th>
              <th>Abono</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento) => (
              <tr
                key={movimiento._id}
                className={
                  selectedMovimiento === movimiento._id ? "table-active" : ""
                }
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const newSelected =
                    selectedMovimiento === movimiento._id ? "" : movimiento._id;
                  onMovimientoSelect(newSelected);
                }}
              >
                <td>
                  <Form.Check
                    type="radio"
                    name="movimiento"
                    checked={selectedMovimiento === movimiento._id}
                    onChange={() => {}}
                  />
                </td>
                <td>
                  {movimiento.numeroReferencia ||
                    movimiento.referencia ||
                    "N/A"}
                </td>
                <td className="text-truncate" style={{ maxWidth: "150px" }}>
                  {movimiento.concepto}
                </td>
                <td>{formatCurrency(movimiento.abono)}</td>
                <td>
                  {format(new Date(movimiento.fecha), "dd/MM/yyyy", {
                    locale: es,
                  })}
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
