"use client";

import React from "react";
import { Card, Table, Form, Row, Col } from "react-bootstrap";
import { format } from "date-fns";
import { ProviderGroup } from "../types";
import { formatCurrency } from "@/utils";

interface ProviderGroupsTableProps {
  providerGroups: ProviderGroup[];
  selectedProviderGroups: string[];
  onProviderGroupSelect: (providerGroupId: string) => void;
  fechaFacturas: string;
  onFechaFacturasChange: (fecha: string) => void;
}

export default function ProviderGroupsTable({
  providerGroups,
  selectedProviderGroups,
  onProviderGroupSelect,
  fechaFacturas,
  onFechaFacturasChange,
}: ProviderGroupsTableProps) {
  return (
    <Card>
      <Card.Header>
        <Row className="align-items-center">
          <Col md={6}>
            <h5 className="mb-0">Proveedores Agrupados</h5>
            <small className="text-muted">Total: {providerGroups.length}</small>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-0">
              <Form.Label className="small mb-1">Fecha Facturas</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={fechaFacturas}
                onChange={(e) => onFechaFacturasChange(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th style={{ width: "50px" }}>
                <Form.Check
                  type="checkbox"
                  checked={
                    selectedProviderGroups.length === providerGroups.length &&
                    providerGroups.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      providerGroups.forEach((group) =>
                        onProviderGroupSelect(group._id)
                      );
                    } else {
                      selectedProviderGroups.forEach((id) =>
                        onProviderGroupSelect(id)
                      );
                    }
                  }}
                />
              </th>
              <th>Folio</th>
              <th>Proveedor</th>
              <th>Razón Social</th>
              <th>Sucursal</th>
              <th>Total Agrupado</th>
              <th>Total Facturas</th>
              <th>Número Banco</th>
            </tr>
          </thead>
          <tbody>
            {providerGroups.map((group) => (
              <tr
                key={group._id}
                className={
                  selectedProviderGroups.includes(group._id)
                    ? "table-success"
                    : ""
                }
                style={{ cursor: "pointer" }}
                onClick={() => onProviderGroupSelect(group._id)}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <Form.Check
                    type="checkbox"
                    checked={selectedProviderGroups.includes(group._id)}
                    onChange={() => onProviderGroupSelect(group._id)}
                  />
                </td>
                <td>#{group.groupingFolio}</td>
                <td className="fw-bold">{group.providerName}</td>
                <td>{group.companyProvider}</td>
                <td>{group.branchName}</td>
                <td className="fw-bold text-success">
                  {formatCurrency(group.totalAmount)}
                </td>
                <td>
                  <span className="badge bg-info">
                    {group.totalInvoices || 0}
                  </span>
                </td>
                <td>
                  <span className="badge bg-primary">{group.bankNumber}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {providerGroups.length === 0 && (
          <div className="text-center text-muted p-3">
            No hay proveedores agrupados disponibles para conciliar
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
