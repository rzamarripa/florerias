"use client";

import React from "react";
import { Modal, Table, Badge } from "react-bootstrap";
import { Expense } from "../types";
import { TrendingDown, Calendar, DollarSign, FileText } from "lucide-react";

interface ExpensesModalProps {
  show: boolean;
  onHide: () => void;
  expenses: Expense[];
  branchName: string;
  loading?: boolean;
}

const ExpensesModal: React.FC<ExpensesModalProps> = ({
  show,
  onHide,
  expenses,
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

  const getExpenseTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
      check_transfer: { bg: "info", text: "white", label: "Cheque/Transferencia" },
      petty_cash: { bg: "warning", text: "dark", label: "Caja Chica" },
    };

    const config = typeConfig[type] || { bg: "secondary", text: "white", label: type };

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

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total, 0);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          color: "white",
          borderRadius: "15px 15px 0 0",
        }}
      >
        <Modal.Title className="d-flex align-items-center">
          <TrendingDown size={24} className="me-2" />
          Gastos de {branchName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3">Cargando gastos...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-5">
            <TrendingDown size={48} className="text-muted mb-3" />
            <p className="text-muted">
              No hay gastos registrados en el período seleccionado
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
                    background: "linear-gradient(135deg, #fa709a15 0%, #fee14015 100%)",
                  }}
                >
                  <div className="card-body text-center">
                    <DollarSign size={24} style={{ color: "#fa709a" }} />
                    <h5 className="mt-2 mb-0 fw-bold" style={{ color: "#fa709a" }}>
                      {formatCurrency(totalExpenses)}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Total de Gastos
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
                    <FileText size={24} style={{ color: "#667eea" }} />
                    <h5 className="mt-2 mb-0 fw-bold" style={{ color: "#667eea" }}>
                      {expenses.length}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Gastos Totales
                    </p>
                  </div>
                </div>
              </div>
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
                      {formatCurrency(totalExpenses / expenses.length)}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Gasto Promedio
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses table */}
            <Table hover responsive className="mb-0">
              <thead>
                <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Folio</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Concepto</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Usuario</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Total</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>Tipo</th>
                  <th style={{ fontSize: "13px", fontWeight: "600" }}>
                    Fecha de Pago
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td className="align-middle">
                      <span className="fw-semibold" style={{ fontSize: "13px" }}>
                        #{expense.folio}
                      </span>
                    </td>
                    <td className="align-middle">
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: "13px" }}>
                          {expense.concept?.name || "Sin concepto"}
                        </p>
                        {expense.concept?.description && (
                          <p
                            className="mb-0 text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            {expense.concept.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="align-middle">
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: "13px" }}>
                          {expense.user.profile.fullName}
                        </p>
                        <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>
                          @{expense.user.username}
                        </p>
                      </div>
                    </td>
                    <td className="align-middle">
                      <span
                        className="fw-bold"
                        style={{ fontSize: "14px", color: "#fa709a" }}
                      >
                        {formatCurrency(expense.total)}
                      </span>
                    </td>
                    <td className="align-middle">
                      {getExpenseTypeBadge(expense.expenseType)}
                    </td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        <Calendar size={14} className="me-2 text-muted" />
                        <span style={{ fontSize: "12px" }}>
                          {formatDate(expense.paymentDate)}
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
          Total: {expenses.length} gasto{expenses.length !== 1 ? "s" : ""} | Monto
          total: {formatCurrency(totalExpenses)}
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default ExpensesModal;
