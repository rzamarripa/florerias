"use client";

import React from "react";
import { Modal, Badge, Table } from "react-bootstrap";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Package,
  DollarSign,
  CreditCard,
  TrendingDown,
  Truck,
  Receipt,
  Building,
} from "lucide-react";
import { Sale } from "../types";

interface SaleDetailModalProps {
  show: boolean;
  onHide: () => void;
  sale: Sale | null;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  show,
  onHide,
  sale,
}) => {
  if (!sale) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      pendiente: { bg: "warning", text: "Pendiente" },
      "en-proceso": { bg: "info", text: "En Proceso" },
      completado: { bg: "success", text: "Completado" },
      cancelado: { bg: "danger", text: "Cancelado" },
    };

    const statusInfo = statusMap[status] || { bg: "secondary", text: status };

    return (
      <Badge
        bg={statusInfo.bg}
        style={{
          padding: "8px 16px",
          borderRadius: "20px",
          fontWeight: "600",
          fontSize: "14px",
        }}
      >
        {statusInfo.text}
      </Badge>
    );
  };

  const discountAmount =
    sale.discountType === "porcentaje"
      ? (sale.subtotal * (sale.discount || 0)) / 100
      : sale.discount || 0;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      contentClassName="border-0 shadow-lg"
    >
      <Modal.Header
        closeButton
        className="border-0 pb-0"
        style={{ background: "#f8f9fa" }}
      >
        <Modal.Title className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1 fw-bold">
                Detalle de Venta #{sale.orderNumber || sale._id.slice(-8)}
              </h4>
              <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                {formatDate(sale.createdAt)}
              </p>
            </div>
            <div>{getStatusBadge(sale.status)}</div>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4" style={{ background: "#f8f9fa" }}>
        {/* Resumen Financiero - Cards */}
        <div className="row g-3 mb-4">
          {/* Card Subtotal */}
          <div className="col-lg-3 col-md-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Subtotal
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(52, 152, 219, 0.1)",
                    }}
                  >
                    <Receipt size={20} style={{ color: "#3498DB" }} />
                  </div>
                </div>
                <h3 className="mb-0 fw-bold" style={{ fontSize: "24px" }}>
                  {formatCurrency(sale.subtotal || 0)}
                </h3>
              </div>
            </div>
          </div>

          {/* Card Descuento */}
          <div className="col-lg-3 col-md-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Descuento
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(231, 76, 60, 0.1)",
                    }}
                  >
                    <TrendingDown size={20} style={{ color: "#E74C3C" }} />
                  </div>
                </div>
                <h3
                  className="mb-0 fw-bold text-danger"
                  style={{ fontSize: "24px" }}
                >
                  -{formatCurrency(discountAmount)}
                </h3>
                {sale.discount > 0 && (
                  <small className="text-muted">
                    {sale.discountType === "porcentaje"
                      ? `${sale.discount}%`
                      : "Cantidad fija"}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Card Total */}
          <div className="col-lg-3 col-md-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Total
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(26, 188, 156, 0.1)",
                    }}
                  >
                    <DollarSign size={20} style={{ color: "#1ABC9C" }} />
                  </div>
                </div>
                <h3
                  className="mb-0 fw-bold text-success"
                  style={{ fontSize: "24px" }}
                >
                  {formatCurrency(sale.total || 0)}
                </h3>
              </div>
            </div>
          </div>

          {/* Card Saldo Pendiente */}
          <div className="col-lg-3 col-md-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Saldo Pendiente
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(243, 156, 18, 0.1)",
                    }}
                  >
                    <CreditCard size={20} style={{ color: "#F39C12" }} />
                  </div>
                </div>
                <h3
                  className="mb-0 fw-bold"
                  style={{
                    fontSize: "24px",
                    color: sale.remainingBalance > 0 ? "#F39C12" : "#1ABC9C",
                  }}
                >
                  {formatCurrency(sale.remainingBalance || 0)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Cliente y Entrega */}
        <div className="row g-3 mb-4">
          {/* Cliente */}
          <div className="col-md-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <User size={20} className="text-primary" />
                  Información del Cliente
                </h5>
                <div className="mb-3">
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <User size={16} className="text-muted mt-1" />
                    <div>
                      <small className="text-muted d-block">Cliente</small>
                      <span className="fw-semibold">
                        {sale.clientInfo?.name || "N/A"}
                      </span>
                    </div>
                  </div>
                  {sale.clientInfo?.phone && (
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <Phone size={16} className="text-muted mt-1" />
                      <div>
                        <small className="text-muted d-block">Teléfono</small>
                        <span className="fw-semibold">
                          {sale.clientInfo.phone}
                        </span>
                      </div>
                    </div>
                  )}
                  {sale.clientInfo?.email && (
                    <div className="d-flex align-items-start gap-2">
                      <Mail size={16} className="text-muted mt-1" />
                      <div>
                        <small className="text-muted d-block">Email</small>
                        <span className="fw-semibold">
                          {sale.clientInfo.email}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-top">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Building size={16} className="text-muted" />
                    <div>
                      <small className="text-muted d-block">Canal</small>
                      <Badge bg="secondary" className="text-capitalize">
                        {sale.salesChannel || "tienda"}
                      </Badge>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CreditCard size={16} className="text-muted" />
                    <div>
                      <small className="text-muted d-block">
                        Método de Pago
                      </small>
                      <Badge bg="primary">
                        {typeof sale.paymentMethod === "string"
                          ? sale.paymentMethod
                          : sale.paymentMethod?.name || "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Entrega */}
          <div className="col-md-6">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Truck size={20} className="text-primary" />
                  Datos de Entrega
                </h5>
                <div className="mb-3">
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <User size={16} className="text-muted mt-1" />
                    <div>
                      <small className="text-muted d-block">
                        Recibe
                      </small>
                      <span className="fw-semibold">
                        {sale.deliveryData?.recipientName || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <Calendar size={16} className="text-muted mt-1" />
                    <div>
                      <small className="text-muted d-block">
                        Fecha de Entrega
                      </small>
                      <span className="fw-semibold">
                        {sale.deliveryData?.deliveryDateTime
                          ? formatDate(sale.deliveryData.deliveryDateTime)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <Package size={16} className="text-muted mt-1" />
                    <div>
                      <small className="text-muted d-block">
                        Tipo de Envío
                      </small>
                      <Badge
                        bg={
                          sale.shippingType === "envio" ? "info" : "secondary"
                        }
                        className="text-capitalize"
                      >
                        {sale.shippingType}
                      </Badge>
                      {sale.shippingType === "envio" &&
                        sale.deliveryData?.deliveryPrice > 0 && (
                          <span className="ms-2 text-muted">
                            (
                            {formatCurrency(
                              sale.deliveryData.deliveryPrice
                            )}
                            )
                          </span>
                        )}
                    </div>
                  </div>

                  {sale.shippingType === "envio" &&
                    sale.deliveryData?.street && (
                      <div className="d-flex align-items-start gap-2">
                        <MapPin size={16} className="text-muted mt-1" />
                        <div>
                          <small className="text-muted d-block">
                            Dirección
                          </small>
                          <span className="fw-semibold">
                            {sale.deliveryData.street}
                          </span>
                          {sale.deliveryData.reference && (
                            <small className="d-block text-muted mt-1">
                              {sale.deliveryData.reference}
                            </small>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {sale.deliveryData?.message && (
                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex align-items-start gap-2">
                      <MessageSquare size={16} className="text-muted mt-1" />
                      <div>
                        <small className="text-muted d-block">Mensaje</small>
                        <p className="mb-0 fst-italic">
                          {sale.deliveryData.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: "12px" }}
        >
          <div className="card-body p-0">
            <div className="p-4 border-bottom">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Package size={20} className="text-primary" />
                Productos
              </h5>
            </div>

            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      CANTIDAD
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      PRODUCTO
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">TIPO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-end">
                      PRECIO UNIT.
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted text-end">
                      IMPORTE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((item, index) => (
                      <tr
                        key={index}
                        style={{ borderBottom: "1px solid #f1f3f5" }}
                      >
                        <td className="px-4 py-3 fw-semibold">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3">
                          <div className="fw-semibold">{item.productName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={item.isProduct ? "success" : "secondary"}
                            className="text-white"
                          >
                            {item.isProduct ? "Catálogo" : "Manual"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-end">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-end fw-bold">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        No hay productos en esta venta
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        {/* Resumen de Pago */}
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "12px" }}
        >
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <DollarSign size={20} className="text-primary" />
              Resumen de Pago
            </h5>
            <div className="row">
              <div className="col-md-6 offset-md-6">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal:</span>
                  <span className="fw-semibold">
                    {formatCurrency(sale.subtotal || 0)}
                  </span>
                </div>
                {sale.discount > 0 && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">
                      Descuento (
                      {sale.discountType === "porcentaje"
                        ? `${sale.discount}%`
                        : "Fijo"}
                      ):
                    </span>
                    <span className="fw-semibold text-danger">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {sale.shippingType === "envio" &&
                  sale.deliveryData?.deliveryPrice > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Costo de Envío:</span>
                      <span className="fw-semibold text-success">
                        +
                        {formatCurrency(
                          sale.deliveryData.deliveryPrice
                        )}
                      </span>
                    </div>
                  )}
                <div className="d-flex justify-content-between mb-2 pt-2 border-top">
                  <span className="fw-bold">Total:</span>
                  <span className="fw-bold fs-5 text-primary">
                    {formatCurrency(sale.total || 0)}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Anticipo:</span>
                  <span className="fw-semibold text-success">
                    {formatCurrency(sale.advance || 0)}
                  </span>
                </div>
                {sale.paidWith > 0 && (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Pagó con:</span>
                      <span className="fw-semibold">
                        {formatCurrency(sale.paidWith)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Cambio:</span>
                      <span className="fw-semibold">
                        {formatCurrency(sale.change || 0)}
                      </span>
                    </div>
                  </>
                )}
                <div className="d-flex justify-content-between pt-2 border-top">
                  <span className="fw-bold">Saldo Pendiente:</span>
                  <span
                    className="fw-bold fs-5"
                    style={{
                      color: sale.remainingBalance > 0 ? "#F39C12" : "#1ABC9C",
                    }}
                  >
                    {formatCurrency(sale.remainingBalance || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SaleDetailModal;
