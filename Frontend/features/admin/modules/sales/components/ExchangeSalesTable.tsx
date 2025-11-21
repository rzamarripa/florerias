"use client";

import React, { useState } from "react";
import { Table, Badge } from "react-bootstrap";
import SaleActions from "./SaleActions";

interface ExchangeSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
}

const ExchangeSalesTable: React.FC<ExchangeSalesTableProps> = ({ filters }) => {
  const sales: any[] = [];

  const handleSaleUpdated = () => {
    // Recargar datos si es necesario cuando se implemente la carga de datos
  };

  return (
    <>
      <div className="table-responsive">
        <Table hover className="mb-0">
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              <th className="px-4 py-3 fw-semibold text-muted">No.</th>
              <th className="px-4 py-3 fw-semibold text-muted">Clientes</th>
              <th className="px-4 py-3 fw-semibold text-muted">Fecha Entrega</th>
              <th className="px-4 py-3 fw-semibold text-muted">Estatus Prod.</th>
              <th className="px-4 py-3 fw-semibold text-muted">Estatus Pago.</th>
              <th className="px-4 py-3 fw-semibold text-muted">Fecha Pedido</th>
              <th className="px-4 py-3 fw-semibold text-muted">Pagado</th>
              <th className="px-4 py-3 fw-semibold text-muted">Saldo</th>
              <th className="px-4 py-3 fw-semibold text-muted text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-5 text-muted">
                  No se encontraron ventas de intercambio
                </td>
              </tr>
            ) : (
              sales.map((sale: any, index: number) => (
                <tr key={sale.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{sale.client}</td>
                  <td className="px-4 py-3">{sale.deliveryDate}</td>
                  <td className="px-4 py-3">
                    <Badge
                      bg="info"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontWeight: "500",
                      }}
                    >
                      {sale.productStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      bg="primary"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontWeight: "500",
                      }}
                    >
                      {sale.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{sale.orderDate}</td>
                  <td className="px-4 py-3 fw-semibold text-success">${sale.paid.toFixed(2)}</td>
                  <td className="px-4 py-3 fw-semibold text-danger">${sale.balance.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <SaleActions
                      sale={sale}
                      onSaleUpdated={handleSaleUpdated}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div className="border-top px-4 py-3">
        <div className="row">
          <div className="col text-end">
            <span className="fw-bold me-5">Total</span>
            <span className="fw-bold text-success me-5">$0.00</span>
            <span className="fw-bold text-danger">$0.00</span>
          </div>
        </div>
      </div>

    </>
  );
};

export default ExchangeSalesTable;
