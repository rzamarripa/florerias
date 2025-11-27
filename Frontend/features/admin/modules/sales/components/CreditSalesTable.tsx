"use client";

import React, { useEffect, useState } from "react";
import { Table, Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../services/sales";
import { Sale } from "../types";
import SaleActions from "./SaleActions";

interface CreditSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
  creditPaymentMethodId?: string;
  onStatsUpdate?: () => void;
}

const CreditSalesTable: React.FC<CreditSalesTableProps> = ({ filters, creditPaymentMethodId, onStatsUpdate }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    if (!creditPaymentMethodId) {
      setSales([]);
      return;
    }

    try {
      setLoading(true);
      const response = await salesService.getCreditSales({
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
        creditPaymentMethodId: creditPaymentMethodId,
        limit: 1000, // Traer todas las ventas a crédito
      });

      if (response.data) {
        setSales(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las ventas a crédito");
      console.error("Error loading credit sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [filters, creditPaymentMethodId]);

  // Socket listeners para actualizaciones en tiempo real
  useOrderSocket({
    filters: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      branchId: filters.branchId,
      status: ["pendiente", "en-proceso", "completado"],
    },
    onOrderCreated: (newOrder) => {
      // Solo agregar si usa el método de pago de crédito
      const orderPaymentMethodId = typeof newOrder.paymentMethod === 'string'
        ? newOrder.paymentMethod
        : newOrder.paymentMethod?._id;

      if (orderPaymentMethodId === creditPaymentMethodId) {
        setSales((prev) => {
          const exists = prev.some((s) => s._id === newOrder._id);
          if (exists) return prev;
          return [newOrder as Sale, ...prev];
        });
        toast.info(`Nueva venta a crédito: ${newOrder.orderNumber || newOrder._id}`);
      }
    },
    onOrderUpdated: (updatedOrder) => {
      const orderPaymentMethodId = typeof updatedOrder.paymentMethod === 'string'
        ? updatedOrder.paymentMethod
        : updatedOrder.paymentMethod?._id;

      const shouldInclude =
        orderPaymentMethodId === creditPaymentMethodId &&
        ["pendiente", "en-proceso", "completado"].includes(updatedOrder.status);

      setSales((prev) => {
        if (shouldInclude) {
          const exists = prev.some((s) => s._id === updatedOrder._id);
          if (exists) {
            return prev.map((s) => (s._id === updatedOrder._id ? updatedOrder as Sale : s));
          } else {
            return [updatedOrder as Sale, ...prev];
          }
        } else {
          return prev.filter((s) => s._id !== updatedOrder._id);
        }
      });
    },
    onOrderDeleted: (data) => {
      setSales((prev) => prev.filter((s) => s._id !== data.orderId));
    },
  });

  const handleSaleUpdated = () => {
    loadSales();
    onStatsUpdate?.();
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
          padding: "6px 12px",
          borderRadius: "20px",
          fontWeight: "500",
        }}
      >
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const totalPaid = sales.reduce((sum, sale) => sum + (sale.advance || 0), 0);
  const totalBalance = sales.reduce((sum, sale) => sum + (sale.remainingBalance || 0), 0);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando ventas...</p>
      </div>
    );
  }

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
                  No se encontraron ventas a crédito
                </td>
              </tr>
            ) : (
              sales.map((sale, index) => (
                <tr key={sale._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{sale.clientInfo?.name || "N/A"}</td>
                  <td className="px-4 py-3">
                    {sale.deliveryData?.deliveryDateTime ? formatDate(sale.deliveryData.deliveryDateTime) : "N/A"}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(sale.status)}</td>
                  <td className="px-4 py-3">{getStatusBadge(sale.status)}</td>
                  <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-3 fw-semibold text-success">${(sale.advance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 fw-semibold text-danger">${(sale.remainingBalance || 0).toFixed(2)}</td>
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
            <span className="fw-bold text-success me-5">${totalPaid.toFixed(2)}</span>
            <span className="fw-bold text-danger">${totalBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </>
  );
};

export default CreditSalesTable;
