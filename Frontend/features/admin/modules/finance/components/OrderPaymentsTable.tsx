"use client";

import React, { useEffect, useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import { financeService } from "../services/finance";
import { FinanceFilters, OrderPayment } from "../types";
import { toast } from "react-toastify";

interface OrderPaymentsTableProps {
  filters: FinanceFilters;
}

const OrderPaymentsTable: React.FC<OrderPaymentsTableProps> = ({ filters }) => {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("OrderPaymentsTable useEffect - filters:", filters);
    // Siempre cargar, el backend resolverá las sucursales automáticamente
    loadOrderPayments();
  }, [filters]);

  const loadOrderPayments = async () => {
    try {
      setLoading(true);
      console.log("Filters being sent:", filters);
      const response = await financeService.getOrderPaymentsByBranch(filters);
      console.log("Response received:", response);
      console.log("Response data:", response.data);
      if (response.data) {
        setPayments(response.data);
        console.log("Payments set to state:", response.data);
      } else {
        console.log("No data in response");
        setPayments([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar pagos de órdenes");
      console.error("Error loading order payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando pagos realizados...</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th className="px-4 py-3 fw-semibold text-muted">No.</th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FOLIO ORDEN
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    NO. ORDEN
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">CLIENTE</th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FECHA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FORMA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    REGISTRADO POR
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    MONTO
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No se encontraron pagos realizados
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => (
                    <tr
                      key={payment._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 fw-semibold">
                        {payment.orderId?.orderNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {payment.orderId?.orderNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {payment.orderId?.clientInfo?.name || "Sin nombre"}
                      </td>
                      <td className="px-4 py-3">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3">
                        {payment.paymentMethod?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {payment.registeredBy
                          ? `${payment.registeredBy.name} ${payment.registeredBy.lastName}`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-end fw-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPaymentsTable;
