"use client";

import React from "react";
import { Card, Table, Form } from "react-bootstrap";
import { Factura } from "../types";
import { formatCurrency } from "@/utils";

interface FacturasTableProps {
  facturas: Factura[];
  selectedFactura: string;
  onFacturaSelect: (facturaId: string) => void;
}

export default function FacturasTable({
  facturas,
  selectedFactura,
  onFacturaSelect,
}: FacturasTableProps) {
  console.log("facturas", facturas);
  return (
    <Card>
      <Card.Header>
        <h5>Facturas de Paquetes (Estatus: Generado)</h5>
        <small className="text-muted">Total: {facturas.length}</small>
      </Card.Header>
      <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th></th>
              <th>Emisor</th>
              <th>Importe</th>
              <th>Folio</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((factura) => (
              <tr
                key={factura._id}
                className={
                  selectedFactura === factura._id ? "table-active" : ""
                }
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const newSelected =
                    selectedFactura === factura._id ? "" : factura._id;
                  onFacturaSelect(newSelected);
                }}
              >
                <td>
                  <Form.Check
                    type="radio"
                    name="factura"
                    checked={selectedFactura === factura._id}
                    onChange={() => {}}
                  />
                </td>
                <td className="text-truncate" style={{ maxWidth: "150px" }}>
                  {factura.nombreEmisor}
                </td>
                <td>{formatCurrency(factura.importePagado )}</td>
                <td>{factura.packageFolio}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {facturas.length === 0 && (
          <div className="text-center text-muted p-3">
            No hay facturas disponibles para conciliar
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
