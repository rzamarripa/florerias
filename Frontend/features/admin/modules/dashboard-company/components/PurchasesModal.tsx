"use client";

import React from "react";
import { Modal, Table, Badge } from "react-bootstrap";
import { Purchase } from "../types";
import { ShoppingCart, Calendar, DollarSign, FileText, Package } from "lucide-react";

interface PurchasesModalProps {
  show: boolean;
  onHide: () => void;
  purchases: Purchase[];
  branchName: string;
  loading?: boolean;
}

const PurchasesModal: React.FC<PurchasesModalProps> = ({
  show,
  onHide,
  purchases,
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
    });
  };

  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "white",
          borderRadius: "15px 15px 0 0",
        }}
      >
        <Modal.Title className="d-flex align-items-center">
          <ShoppingCart size={24} className="me-2" />
          Compras de {branchName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3">Cargando compras...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-5">
            <ShoppingCart size={48} className="text-muted mb-3" />
            <p className="text-muted">
              No hay compras registradas en el período seleccionado
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
                    background: "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)",
                  }}
                >
                  <div className="card-body text-center">
                    <DollarSign size={24} style={{ color: "#4facfe" }} />
                    <h5 className="mt-2 mb-0 fw-bold" style={{ color: "#4facfe" }}>
                      {formatCurrency(totalPurchases)}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Total de Compras
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                  }}
                >
                  <div className="card-body text-center">
                    <Package size={24} style={{ color: "#667eea" }} />
                    <h5 className="mt-2 mb-0 fw-bold" style={{ color: "#667eea" }}>
                      {purchases.length}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Compras Totales
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background: "linear-gradient(135deg, #43e97b15 0%, #38f9d715 100%)",
                  }}
                >
                  <div className="card-body text-center">
                    <DollarSign size={24} style={{ color: "#43e97b" }} />
                    <h5 className="mt-2 mb-0 fw-bold" style={{ color: "#43e97b" }}>
                      {formatCurrency(totalPurchases / purchases.length)}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Compra Promedio
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchases table */}
            <Table hover responsive className="mb-0">
              <thead>
                <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Folio</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Concepto</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Proveedor</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Usuario</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Importe</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Método de Pago
                  </th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Fecha de Pago
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase._id}>
                    <td className="align-middle">
                      <span className="fw-semibold" style={{ fontSize: "13px" }}>
                        #{purchase.folio}
                      </span>
                    </td>
                    <td className="align-middle">
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: "13px" }}>
                          {purchase.concept?.name || "Sin concepto"}
                        </p>
                        {purchase.concept?.description && (
                          <p
                            className="mb-0 text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            {purchase.concept.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="align-middle">
                      {purchase.provider ? (
                        <div>
                          <p className="mb-0 fw-semibold" style={{ fontSize: "13px" }}>
                            {purchase.provider.tradeName || purchase.provider.legalName}
                          </p>
                          {purchase.provider.tradeName && purchase.provider.legalName && (
                            <p
                              className="mb-0 text-muted"
                              style={{ fontSize: "11px" }}
                            >
                              {purchase.provider.legalName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: "13px" }}>
                          Sin proveedor
                        </span>
                      )}
                    </td>
                    <td className="align-middle">
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: "13px" }}>
                          {purchase.user.profile.fullName}
                        </p>
                        <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>
                          @{purchase.user.username}
                        </p>
                      </div>
                    </td>
                    <td className="align-middle">
                      <span
                        className="fw-bold"
                        style={{ fontSize: "14px", color: "#4facfe" }}
                      >
                        {formatCurrency(purchase.amount)}
                      </span>
                    </td>
                    <td className="align-middle">
                      <Badge
                        bg="light"
                        text="dark"
                        className="px-3 py-2"
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          borderRadius: "8px",
                        }}
                      >
                        {purchase.paymentMethod.name}
                      </Badge>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <Calendar size={14} className="me-2 text-muted" />
                        <span style={{ fontSize: "12px" }}>
                          {formatDate(purchase.paymentDate)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <p className="text-muted mb-0 me-auto" style={{ fontSize: "13px" }}>
          Total: {purchases.length} compra{purchases.length !== 1 ? "s" : ""} | Monto
          total: {formatCurrency(totalPurchases)}
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default PurchasesModal;
