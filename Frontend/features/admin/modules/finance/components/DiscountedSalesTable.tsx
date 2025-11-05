"use client";

import React, { useEffect, useState } from "react";
import { Table, Spinner, Badge } from "react-bootstrap";
import { financeService } from "../services/finance";
import { FinanceFilters, DiscountedSale } from "../types";
import { toast } from "react-toastify";

interface DiscountedSalesTableProps {
  filters: FinanceFilters;
}

const DiscountedSalesTable: React.FC<DiscountedSalesTableProps> = ({ filters }) => {
  const [sales, setSales] = useState<DiscountedSale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("DiscountedSalesTable useEffect - filters:", filters);
    loadDiscountedSales();
  }, [filters]);

  const loadDiscountedSales = async () => {
    try {
      setLoading(true);
      console.log("Loading discounted sales with filters:", filters);
      const response = await financeService.getDiscountedSales(filters);
      console.log("Response received:", response);
      if (response.data) {
        setSales(response.data);
        console.log("Sales set to state:", response.data);
      } else {
        console.log("No data in response");
        setSales([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar ventas con descuento");
      console.error("Error loading discounted sales:", error);
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; text: string }> = {
      pending: { variant: "warning", text: "Pendiente" },
      completed: { variant: "success", text: "Completada" },
      cancelled: { variant: "danger", text: "Cancelada" },
      in_progress: { variant: "info", text: "En Proceso" },
    };

    const statusInfo = statusMap[status] || { variant: "secondary", text: status };

    return (
      <Badge bg={statusInfo.variant} className="px-2 py-1">
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDiscountType = (discountType: string) => {
    return discountType === "percentage" ? "%" : "$";
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando ventas con descuento...</p>
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
                    NO. ORDEN
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">CLIENTE</th>
                  <th className="px-4 py-3 fw-semibold text-muted">SUCURSAL</th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FECHA
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    SUBTOTAL
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    DESCUENTO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    TOTAL
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    ESTADO
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      No se encontraron ventas con descuento
                    </td>
                  </tr>
                ) : (
                  sales.map((sale, index) => (
                    <tr
                      key={sale._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 fw-semibold">
                        {sale.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        {sale.clientName}
                      </td>
                      <td className="px-4 py-3">
                        {sale.branchName}
                      </td>
                      <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(sale.subtotal)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-danger fw-semibold">
                          -{formatCurrency(sale.discount)}{" "}
                          {sale.discountType && `(${formatDiscountType(sale.discountType)})`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end fw-semibold">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(sale.status)}
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

export default DiscountedSalesTable;
