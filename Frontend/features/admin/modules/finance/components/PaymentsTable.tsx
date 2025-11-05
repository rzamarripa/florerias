"use client";

import React, { useEffect, useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import { financeService } from "../services/finance";
import { FinanceFilters, Payment } from "../types";
import { toast } from "react-toastify";

interface PaymentsTableProps {
  filters: FinanceFilters;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ filters }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await financeService.getPayments(filters);
      if (response.data) {
        setPayments(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar listado de cobros");
      console.error("Error loading payments:", error);
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
        <p className="text-muted mt-3">Cargando cobros realizados...</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h5 className="fw-bold mb-3">Listado de Cobros Realizados</h5>
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
                  <th className="px-4 py-3 fw-semibold text-muted">FOLIO</th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FECHA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FORMA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">CLIENTE</th>
                  <th className="px-4 py-3 fw-semibold text-muted">USUARIO</th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No se encontraron cobros realizados
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => (
                    <tr
                      key={payment._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 fw-semibold">{payment.folio}</td>
                      <td className="px-4 py-3">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-3">{payment.paymentMethod}</td>
                      <td className="px-4 py-3">{payment.client}</td>
                      <td className="px-4 py-3">{payment.user}</td>
                      <td className="px-4 py-3 text-end fw-semibold">
                        {formatCurrency(payment.total)}
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

export default PaymentsTable;
