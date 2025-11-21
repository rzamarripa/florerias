"use client";

import React from "react";
import { Modal, Button, Table, Badge, Spinner } from "react-bootstrap";
import {
  DollarSign,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Repeat,
  X,
} from "lucide-react";
import { CashRegisterLog } from "../types";

interface CashCountDetailModalProps {
  show: boolean;
  onHide: () => void;
  log: CashRegisterLog | null;
  loading: boolean;
}

const CashCountDetailModal: React.FC<CashCountDetailModalProps> = ({
  show,
  onHide,
  log,
  loading,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || !log) {
    return (
      <Modal show={show} onHide={onHide} centered size="xl">
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Cargando detalle...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h4 className="fw-bold mb-1">Detalle de Cierre de Caja</h4>
              <p className="text-muted mb-0">
                {log.cashRegisterName} - {log.branchId.branchName}
              </p>
              <small className="text-muted">
                Cerrado el: {formatDate(log.closedAt)}
              </small>
            </div>
            <Button
              variant="light"
              onClick={onHide}
              className="rounded-circle"
              style={{ width: "36px", height: "36px", padding: "0" }}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-3" style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {/* Totales Section */}
        <div
          className="card border-0 shadow-sm mb-3"
          style={{ borderRadius: "12px" }}
        >
          <div className="card-body p-3">
            <h6 className="fw-bold mb-3">Esta caja contaba con:</h6>

            <div className="row g-3">
              <div className="col-md-3">
                <div className="text-end">
                  <div className="text-muted mb-1" style={{ fontSize: "12px" }}>
                    Saldo Inicial
                  </div>
                  <div className="fw-bold fs-6">
                    {formatCurrency(log.totals.initialBalance)}
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="text-end">
                  <div className="text-muted mb-1" style={{ fontSize: "12px" }}>
                    ( + ) Ventas
                  </div>
                  <div className="fw-bold fs-6 text-success">
                    {formatCurrency(log.totals.totalSales)}
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="text-end">
                  <div className="text-muted mb-1" style={{ fontSize: "12px" }}>
                    ( - ) Gastos
                  </div>
                  <div className="fw-bold fs-6 text-danger">
                    {formatCurrency(log.totals.totalExpenses)}
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="text-end">
                  <div className="text-muted mb-1" style={{ fontSize: "12px" }}>
                    ( = ) Saldo Total
                  </div>
                  <div className="fw-bold fs-5 text-primary">
                    {formatCurrency(log.totals.finalBalance)}
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-2" style={{ opacity: 0.1 }} />

            <p className="fw-bold mb-0" style={{ fontSize: "14px" }}>
              Total Efectivo: {formatCurrency(log.salesByPaymentType.efectivo)}
            </p>
          </div>
        </div>

        {/* Income Cards Section - Ingresos */}
        <h6 className="fw-bold mb-2">Ingresos</h6>
        <div className="row g-2 mb-3">
          {/* Card Efectivo */}
          <div className="col-md-3 col-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "10px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "11px" }}
                  >
                    Efectivo
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(26, 188, 156, 0.1)",
                    }}
                  >
                    <DollarSign size={18} style={{ color: "#1ABC9C" }} />
                  </div>
                </div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: "20px" }}>
                  {formatCurrency(log.salesByPaymentType.efectivo)}
                </h5>
              </div>
            </div>
          </div>

          {/* Card Intercambio */}
          <div className="col-md-3 col-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "10px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "11px" }}
                  >
                    Intercambio
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(243, 156, 18, 0.1)",
                    }}
                  >
                    <Repeat size={18} style={{ color: "#F39C12" }} />
                  </div>
                </div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: "20px" }}>
                  {formatCurrency(log.salesByPaymentType.intercambio)}
                </h5>
              </div>
            </div>
          </div>

          {/* Card Crédito */}
          <div className="col-md-3 col-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "10px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "11px" }}
                  >
                    Crédito
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(52, 152, 219, 0.1)",
                    }}
                  >
                    <CreditCard size={18} style={{ color: "#3498DB" }} />
                  </div>
                </div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: "20px" }}>
                  {formatCurrency(log.salesByPaymentType.credito)}
                </h5>
              </div>
            </div>
          </div>

          {/* Card Transferencia */}
          <div className="col-md-3 col-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "10px" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "11px" }}
                  >
                    Transferencia
                  </h6>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(155, 89, 182, 0.1)",
                    }}
                  >
                    <ArrowLeftRight size={18} style={{ color: "#9B59B6" }} />
                  </div>
                </div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: "20px" }}>
                  {formatCurrency(log.salesByPaymentType.transferencia)}
                </h5>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table Section */}
        <div
          className="card border-0 shadow-sm mb-3"
          style={{ borderRadius: "12px" }}
        >
          <div className="card-body p-0">
            <div className="p-3 border-bottom">
              <h6 className="fw-bold mb-0">Detalle de Ventas</h6>
            </div>

            <div className="table-responsive">
              <Table hover className="mb-0" style={{ fontSize: "13px" }}>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-3 py-2 fw-semibold text-muted">No.</th>
                    <th className="px-3 py-2 fw-semibold text-muted">FECHA</th>
                    <th className="px-3 py-2 fw-semibold text-muted">
                      FORMA PAGO
                    </th>
                    <th className="px-3 py-2 fw-semibold text-muted">CLIENTE</th>
                    <th className="px-3 py-2 fw-semibold text-muted">VENTA</th>
                    <th className="px-3 py-2 fw-semibold text-muted">IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {log.orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        <Wallet size={36} className="mb-2 opacity-50" />
                        <p className="mb-0" style={{ fontSize: "12px" }}>
                          No se encontraron ventas
                        </p>
                      </td>
                    </tr>
                  ) : (
                    log.orders.map((order, index) => (
                      <tr
                        key={order._id || index}
                        style={{ borderBottom: "1px solid #f1f3f5" }}
                      >
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">
                          <small>{formatDate(order.saleDate)}</small>
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            bg={
                              order.paymentMethod.toLowerCase().includes("efectivo")
                                ? "success"
                                : order.paymentMethod.toLowerCase().includes("crédito") ||
                                  order.paymentMethod.toLowerCase().includes("credito") ||
                                  order.paymentMethod.toLowerCase().includes("tarjeta")
                                ? "primary"
                                : order.paymentMethod.toLowerCase().includes("transferencia")
                                ? "info"
                                : order.paymentMethod.toLowerCase().includes("intercambio")
                                ? "warning"
                                : "secondary"
                            }
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontWeight: "500",
                              fontSize: "0.7rem",
                            }}
                          >
                            {order.paymentMethod}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="fw-semibold" style={{ fontSize: "12px" }}>
                            {order.clientName}
                          </div>
                          <small className="text-muted" style={{ fontSize: "10px" }}>
                            Para: {order.recipientName}
                          </small>
                        </td>
                        <td className="px-3 py-2">
                          <div style={{ fontSize: "12px" }}>{order.orderNumber}</div>
                          <small className="text-muted" style={{ fontSize: "10px" }}>
                            {order.itemsCount}{" "}
                            {order.itemsCount === 1 ? "producto" : "productos"}
                          </small>
                        </td>
                        <td className="px-3 py-2">
                          <span className="fw-bold" style={{ fontSize: "13px" }}>
                            {formatCurrency(order.advance)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        {/* Expenses Table Section */}
        {log.expenses && log.expenses.length > 0 && (
          <div
            className="card border-0 shadow-sm mb-3"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body p-0">
              <div className="p-3 border-bottom">
                <h6 className="fw-bold mb-0">Detalle de Gastos</h6>
              </div>

              <div className="table-responsive">
                <Table hover className="mb-0" style={{ fontSize: "13px" }}>
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th className="px-3 py-2 fw-semibold text-muted">No.</th>
                      <th className="px-3 py-2 fw-semibold text-muted">FECHA</th>
                      <th className="px-3 py-2 fw-semibold text-muted">CONCEPTO</th>
                      <th className="px-3 py-2 fw-semibold text-muted text-end">IMPORTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.expenses.map((expense, index) => (
                      <tr
                        key={expense._id || index}
                        style={{ borderBottom: "1px solid #f1f3f5" }}
                      >
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">
                          <small>{formatDate(expense.expenseDate)}</small>
                        </td>
                        <td className="px-3 py-2">
                          <div className="fw-semibold" style={{ fontSize: "12px" }}>
                            {expense.expenseConcept}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-end">
                          <span className="fw-bold text-danger" style={{ fontSize: "13px" }}>
                            {formatCurrency(expense.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Buys Table Section */}
        {log.buys && log.buys.length > 0 && (
          <div
            className="card border-0 shadow-sm mb-3"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body p-0">
              <div className="p-3 border-bottom">
                <h6 className="fw-bold mb-0">Detalle de Compras en Efectivo</h6>
              </div>

              <div className="table-responsive">
                <Table hover className="mb-0" style={{ fontSize: "13px" }}>
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th className="px-3 py-2 fw-semibold text-muted">FOLIO</th>
                      <th className="px-3 py-2 fw-semibold text-muted">FECHA</th>
                      <th className="px-3 py-2 fw-semibold text-muted">CONCEPTO</th>
                      <th className="px-3 py-2 fw-semibold text-muted">PROVEEDOR</th>
                      <th className="px-3 py-2 fw-semibold text-muted">USUARIO</th>
                      <th className="px-3 py-2 fw-semibold text-muted text-end">IMPORTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.buys.map((buy, index) => (
                      <tr
                        key={buy._id || index}
                        style={{ borderBottom: "1px solid #f1f3f5" }}
                      >
                        <td className="px-3 py-2">
                          <span className="fw-semibold">{buy.folio}</span>
                        </td>
                        <td className="px-3 py-2">
                          <small>{formatDate(buy.paymentDate)}</small>
                        </td>
                        <td className="px-3 py-2">
                          <div className="fw-semibold" style={{ fontSize: "12px" }}>
                            {buy.concept}
                          </div>
                          {buy.description && (
                            <small className="text-muted" style={{ fontSize: "10px" }}>
                              {buy.description}
                            </small>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <small>{buy.provider}</small>
                        </td>
                        <td className="px-3 py-2">
                          <small>{buy.user}</small>
                        </td>
                        <td className="px-3 py-2 text-end">
                          <span className="fw-bold" style={{ fontSize: "13px", color: "#856404" }}>
                            {formatCurrency(buy.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CashCountDetailModal;
