"use client";

import React from "react";
import { Modal, Table, Badge } from "react-bootstrap";
import { Sale } from "../types";
import { ShoppingCart, Calendar, DollarSign } from "lucide-react";

interface SalesModalProps {
  show: boolean;
  onHide: () => void;
  sales: Sale[];
  branchName: string;
  loading?: boolean;
}

const SalesModal: React.FC<SalesModalProps> = ({
  show,
  onHide,
  sales,
  branchName,
  loading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      pendiente: { bg: "warning", text: "dark", label: "Pendiente" },
      "en-proceso": { bg: "info", text: "white", label: "En Proceso" },
      completado: { bg: "success", text: "white", label: "Completado" },
      cancelado: { bg: "danger", text: "white", label: "Cancelado" },
    };

    const config = statusConfig[status] || statusConfig.pendiente;

    return (
      <Badge
        bg={config.bg}
        text={config.text}
        className="px-3 py-2"
        style={{
          fontSize: "11px",
          fontWeight: "600",
          borderRadius: "8px",
        }}
      >
        {config.label}
      </Badge>
    );
  };

  const getChannelBadge = (channel: string) => {
    const channelConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      tienda: { bg: "primary", text: "white", label: "Tienda" },
      whatsapp: { bg: "success", text: "white", label: "WhatsApp" },
      facebook: { bg: "info", text: "white", label: "Facebook" },
    };

    const config = channelConfig[channel] || channelConfig.tienda;

    return (
      <Badge
        bg={config.bg}
        text={config.text}
        className="px-2 py-1"
        style={{
          fontSize: "11px",
          fontWeight: "600",
          borderRadius: "6px",
        }}
      >
        {config.label}
      </Badge>
    );
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          color: "white",
          borderRadius: "15px 15px 0 0",
        }}
      >
        <Modal.Title className="d-flex align-items-center">
          <ShoppingCart size={24} className="me-2" />
          Ventas de {branchName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3">Cargando ventas...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-5">
            <ShoppingCart size={48} className="text-muted mb-3" />
            <p className="text-muted">
              No hay ventas registradas en el período seleccionado
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #43e97b15 0%, #38f9d715 100%)",
                  }}
                >
                  <div className="card-body text-center">
                    <DollarSign size={24} style={{ color: "#43e97b" }} />
                    <h5
                      className="mt-2 mb-0 fw-bold"
                      style={{ color: "#43e97b" }}
                    >
                      {formatCurrency(totalSales)}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Total de Ventas
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                  }}
                >
                  <div className="card-body text-center">
                    <ShoppingCart size={24} style={{ color: "#667eea" }} />
                    <h5
                      className="mt-2 mb-0 fw-bold"
                      style={{ color: "#667eea" }}
                    >
                      {sales.length}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Órdenes Totales
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)",
                  }}
                >
                  <div className="card-body text-center">
                    <DollarSign size={24} style={{ color: "#4facfe" }} />
                    <h5
                      className="mt-2 mb-0 fw-bold"
                      style={{ color: "#4facfe" }}
                    >
                      {formatCurrency(totalSales / sales.length)}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Ticket Promedio
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales table */}
            <Table hover responsive className="mb-0">
              <thead>
                <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Folio
                  </th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Cliente
                  </th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Canal
                  </th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Total
                  </th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Método de Pago
                  </th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Fecha
                  </th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="align-middle">
                      <span
                        className="fw-semibold"
                        style={{ fontSize: "13px" }}
                      >
                        {sale.orderNumber}
                      </span>
                    </td>
                    <td className="align-middle">
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: "13px" }}>
                          {sale.clientInfo.name}
                        </p>
                        {sale.clientInfo.phone && (
                          <p
                            className="mb-0 text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            {sale.clientInfo.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="align-middle">
                      {getChannelBadge(sale.salesChannel)}
                    </td>
                    <td className="align-middle">
                      <span
                        className="fw-bold"
                        style={{ fontSize: "14px", color: "#43e97b" }}
                      >
                        {formatCurrency(sale.total)}
                      </span>
                    </td>
                    <td className="align-middle">
                      <span style={{ fontSize: "13px" }}>
                        {sale.paymentMethod.name}
                      </span>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <Calendar size={14} className="me-2 text-muted" />
                        <span style={{ fontSize: "12px" }}>
                          {formatDate(sale.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="align-middle">{getStatusBadge(sale.status)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <p className="text-muted mb-0 me-auto" style={{ fontSize: "13px" }}>
          Total: {sales.length} venta{sales.length !== 1 ? "s" : ""} | Monto
          total: {formatCurrency(totalSales)}
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default SalesModal;
