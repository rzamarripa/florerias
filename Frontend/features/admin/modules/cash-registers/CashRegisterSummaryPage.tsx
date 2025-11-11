"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spinner, Table, Badge } from "react-bootstrap";
import {
  DollarSign,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Repeat,
  ArrowLeft,
  DoorClosed,
} from "lucide-react";
import { toast } from "react-toastify";
import { cashRegistersService } from "./services/cashRegisters";
import { CashRegisterSummary } from "./types";
import { generateCashRegisterTicket } from "./utils/generateCashRegisterTicket";
import { useUserSessionStore } from "@/stores/userSessionStore";
import CloseConfirmDialog from "./components/CloseConfirmDialog";

const CashRegisterSummaryPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cashRegisterId = searchParams.get("id");
  const { user } = useUserSessionStore();

  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  useEffect(() => {
    if (cashRegisterId) {
      loadSummary();
    } else {
      toast.error("ID de caja no proporcionado");
      router.push("/ventas/cajas");
    }
  }, [cashRegisterId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await cashRegistersService.getCashRegisterSummary(
        cashRegisterId!
      );

      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el resumen de la caja");
      console.error("Error loading cash register summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAndPrintTicket = (remainingBalance: number) => {
    if (!summary || !user) return;

    try {
      // Generar número de folio único basado en timestamp
      const folioNumber = `CORTE-${summary.cashRegister._id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      // Obtener nombre del cajero
      const closedBy = user.profile?.fullName || "Cajero";

      // Fecha de cierre
      const closureDate = new Date().toISOString();

      // Generar el HTML del ticket
      const ticketHTML = generateCashRegisterTicket(summary, {
        closedBy,
        closureDate,
        folioNumber,
        remainingBalance,
      });

      // Crear una nueva ventana para imprimir
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();

        // Esperar a que se cargue el contenido antes de imprimir
        printWindow.onload = () => {
          printWindow.focus();
        };
      } else {
        toast.error("No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.");
      }
    } catch (error) {
      console.error("Error generando ticket:", error);
      toast.error("Error al generar el ticket de cierre");
    }
  };

  const handleCloseCashRegister = async (remainingBalance: number) => {
    if (!cashRegisterId) return;

    try {
      setClosing(true);
      const response = await cashRegistersService.closeCashRegister(
        cashRegisterId,
        remainingBalance
      );

      if (response.success) {
        toast.success(response.message || "Caja cerrada exitosamente");

        // Generar e imprimir el ticket después del cierre exitoso
        generateAndPrintTicket(remainingBalance);

        // Cerrar el diálogo
        setShowCloseDialog(false);

        // Pequeño delay para dar tiempo a que se abra la ventana de impresión
        // antes de redirigir
        setTimeout(() => {
          router.push("/ventas/cajas");
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cerrar la caja");
      console.error("Error closing cash register:", error);
    } finally {
      setClosing(false);
    }
  };

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

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Cargando resumen de la caja...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <p className="text-muted">No se pudo cargar el resumen de la caja</p>
          <Button
            variant="primary"
            onClick={() => router.push("/ventas/cajas")}
          >
            Volver a Cajas Registradoras
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="light"
            onClick={() => router.push("/ventas/cajas")}
            className="rounded-circle"
            style={{ width: "40px", height: "40px", padding: "0" }}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="mb-1 fw-bold">Resumen de Cierre de Caja</h2>
            <p className="text-muted mb-0">
              {summary.cashRegister.name} -{" "}
              {summary.cashRegister.branchId.branchName}
            </p>
          </div>
        </div>
      </div>

      {/* Totales Section */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-2">
          <h5 className="fw-bold mb-2">Esta caja cuenta actualmente con:</h5>

          <div className="row g-4">
            <div className="col-md-3">
              <div className="text-center">
                <div className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  Saldo Inicial
                </div>
                <div className="fw-bold fs-5">
                  {formatCurrency(summary.totals.initialBalance)}
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="text-center">
                <div className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  ( + ) Ventas
                </div>
                <div className="fw-bold fs-5 text-success">
                  {formatCurrency(summary.totals.totalSales)}
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="text-center">
                <div className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  ( - ) Gastos
                </div>
                <div className="fw-bold fs-5 text-danger">
                  {formatCurrency(summary.totals.totalExpenses)}
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="text-center">
                <div className="text-muted mb-1" style={{ fontSize: "14px" }}>
                  ( = ) Saldo Total
                </div>
                <div className="fw-bold fs-4 text-primary">
                  {formatCurrency(summary.totals.currentBalance)}
                </div>
              </div>
            </div>
          </div>

          <hr className="my-1" style={{ opacity: 0.1 }} />

          <h6 className="fw-bold mb-3">
            Total Efectivo: {formatCurrency(summary.salesByPaymentType.efectivo)}
          </h6>
        </div>
      </div>

      {/* Income Cards Section - Ingresos */}
      <h5 className="fw-bold mb-3">Ingresos</h5>
      <div className="row g-3 mb-4">
        {/* Card Efectivo */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Efectivo
                  </h6>
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(26, 188, 156, 0.1)",
                  }}
                >
                  <DollarSign size={24} style={{ color: "#1ABC9C" }} />
                </div>
              </div>
              <h2 className="mb-1 fw-bold" style={{ fontSize: "28px" }}>
                {formatCurrency(summary.salesByPaymentType.efectivo)}
              </h2>
            </div>
          </div>
        </div>

        {/* Card Intercambio */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Intercambio
                  </h6>
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(243, 156, 18, 0.1)",
                  }}
                >
                  <Repeat size={24} style={{ color: "#F39C12" }} />
                </div>
              </div>
              <h2 className="mb-1 fw-bold" style={{ fontSize: "28px" }}>
                {formatCurrency(summary.salesByPaymentType.intercambio)}
              </h2>
            </div>
          </div>
        </div>

        {/* Card Crédito */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Crédito
                  </h6>
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(52, 152, 219, 0.1)",
                  }}
                >
                  <CreditCard size={24} style={{ color: "#3498DB" }} />
                </div>
              </div>
              <h2 className="mb-1 fw-bold" style={{ fontSize: "28px" }}>
                {formatCurrency(summary.salesByPaymentType.credito)}
              </h2>
            </div>
          </div>
        </div>

        {/* Card Transferencia */}
        <div className="col-lg-3 col-md-6">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6
                    className="text-muted mb-0 fw-normal"
                    style={{ fontSize: "13px" }}
                  >
                    Transferencia
                  </h6>
                </div>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(155, 89, 182, 0.1)",
                  }}
                >
                  <ArrowLeftRight size={24} style={{ color: "#9B59B6" }} />
                </div>
              </div>
              <h2 className="mb-1 fw-bold" style={{ fontSize: "28px" }}>
                {formatCurrency(summary.salesByPaymentType.transferencia)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table Section */}
      {summary.expenses && summary.expenses.length > 0 && (
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: "15px" }}
        >
          <div className="card-body p-0">
            <div className="p-4 border-bottom">
              <h5 className="fw-bold mb-0">Detalle de Gastos</h5>
            </div>

            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">FOLIO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">FECHA</th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      CONCEPTO
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      USUARIO
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.expenses.map((expense) => (
                    <tr
                      key={expense._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">
                        <span className="fw-semibold">#{expense.folio}</span>
                      </td>
                      <td className="px-4 py-3">
                        <small>{formatDate(expense.paymentDate)}</small>
                      </td>
                      <td className="px-4 py-3">
                        <div className="fw-semibold">{expense.concept}</div>
                        {expense.conceptDescription && (
                          <small className="text-muted">
                            {expense.conceptDescription}
                          </small>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted">{expense.user}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="fw-bold text-danger">
                          {formatCurrency(expense.total)}
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

      {/* Sales Table Section */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-0">
          <div className="p-4 border-bottom">
            <h5 className="fw-bold mb-0">Detalle de Ventas</h5>
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th className="px-4 py-3 fw-semibold text-muted">No.</th>
                  <th className="px-4 py-3 fw-semibold text-muted">FECHA</th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FORMA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">CLIENTE</th>
                  <th className="px-4 py-3 fw-semibold text-muted">VENTA</th>
                  <th className="px-4 py-3 fw-semibold text-muted">IMPORTE</th>
                </tr>
              </thead>
              <tbody>
                {summary.orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <Wallet size={48} className="mb-3 opacity-50" />
                      <p className="mb-0">No se encontraron ventas</p>
                    </td>
                  </tr>
                ) : (
                  summary.orders.map((order, index) => (
                    <tr
                      key={order._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <small>{formatDate(order.createdAt)}</small>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          bg={
                            order.paymentMethod
                              .toLowerCase()
                              .includes("efectivo")
                              ? "success"
                              : order.paymentMethod
                                  .toLowerCase()
                                  .includes("crédito") ||
                                order.paymentMethod
                                  .toLowerCase()
                                  .includes("credito") ||
                                order.paymentMethod
                                  .toLowerCase()
                                  .includes("tarjeta")
                              ? "primary"
                              : order.paymentMethod
                                  .toLowerCase()
                                  .includes("transferencia")
                              ? "info"
                              : order.paymentMethod
                                  .toLowerCase()
                                  .includes("intercambio")
                              ? "warning"
                              : "secondary"
                          }
                          style={{
                            padding: "4px 8px",
                            borderRadius: "15px",
                            fontWeight: "500",
                            fontSize: "0.75rem",
                          }}
                        >
                          {order.paymentMethod}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="fw-semibold">{order.clientName}</div>
                        <small className="text-muted">
                          Para: {order.recipientName}
                        </small>
                      </td>
                      <td className="px-4 py-3">
                        <div>{order.orderNumber}</div>
                        <small className="text-muted">
                          {order.itemsCount}{" "}
                          {order.itemsCount === 1 ? "producto" : "productos"}
                        </small>
                      </td>
                      <td className="px-4 py-3">
                        <span className="fw-bold">
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

      {/* Close Cash Register Button */}
      <div className="text-center mb-4">
        <Button
          variant="danger"
          size="lg"
          onClick={() => setShowCloseDialog(true)}
          disabled={closing}
          className="px-5 py-3"
          style={{
            borderRadius: "12px",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(231, 76, 60, 0.3)",
          }}
        >
          <DoorClosed size={20} className="me-2" />
          Cerrar Caja
        </Button>
      </div>

      {/* Close Confirmation Dialog */}
      <CloseConfirmDialog
        show={showCloseDialog}
        onHide={() => setShowCloseDialog(false)}
        onConfirm={handleCloseCashRegister}
        currentBalance={summary.totals.currentBalance}
        isClosing={closing}
      />
    </div>
  );
};

export default CashRegisterSummaryPage;
