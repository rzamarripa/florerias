"use client";

import React, { useEffect, useState } from "react";
import { Table, Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../../services/sales";
import { Sale } from "../../types";
import SaleActions from "../SaleActions";

interface ExchangeSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
  exchangePaymentMethodId?: string;
}

const ExchangeSalesTable: React.FC<ExchangeSalesTableProps> = ({
  filters,
  exchangePaymentMethodId,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    if (!exchangePaymentMethodId) {
      setSales([]);
      return;
    }

    try {
      setLoading(true);
      const response = await salesService.getExchangeSales({
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
        exchangePaymentMethodId: exchangePaymentMethodId,
        limit: 1000, // Traer todas las ventas de intercambio
      });

      if (response.data) {
        setSales(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las ventas de intercambio");
      console.error("Error loading exchange sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [filters, exchangePaymentMethodId]);

  // Socket listeners para actualizaciones en tiempo real
  useOrderSocket({
    filters: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      branchId: filters.branchId,
      status: ["pendiente", "en-proceso", "completado"],
    },
    onOrderCreated: (newOrder) => {
      // Solo agregar si usa el método de pago de intercambio
      const orderPaymentMethodId =
        typeof newOrder.paymentMethod === "string"
          ? newOrder.paymentMethod
          : newOrder.paymentMethod?._id;

      if (orderPaymentMethodId === exchangePaymentMethodId) {
        setSales((prev) => {
          const exists = prev.some((s) => s._id === newOrder._id);
          if (exists) return prev;
          return [newOrder as Sale, ...prev];
        });
        toast.info(
          `Nueva venta de intercambio: ${newOrder.orderNumber || newOrder._id}`
        );
      }
    },
    onOrderUpdated: (updatedOrder) => {
      const orderPaymentMethodId =
        typeof updatedOrder.paymentMethod === "string"
          ? updatedOrder.paymentMethod
          : updatedOrder.paymentMethod?._id;

      // Incluir solo si: es el método de intercambio Y NO está cancelada
      const shouldInclude =
        orderPaymentMethodId === exchangePaymentMethodId &&
        ["pendiente", "en-proceso", "completado"].includes(updatedOrder.status);

      setSales((prev) => {
        if (shouldInclude) {
          const exists = prev.some((s) => s._id === updatedOrder._id);
          if (exists) {
            return prev.map((s) =>
              s._id === updatedOrder._id ? (updatedOrder as Sale) : s
            );
          } else {
            return [updatedOrder as Sale, ...prev];
          }
        } else {
          // Remover si cambió de método de pago O fue cancelada
          const removed = prev.filter((s) => s._id !== updatedOrder._id);
          if (
            removed.length < prev.length &&
            updatedOrder.status === "cancelado"
          ) {
            console.log(
              `Venta ${updatedOrder.orderNumber} removida de Ventas de Intercambio (cancelada)`
            );
          }
          return removed;
        }
      });
    },
    onOrderDeleted: (data) => {
      setSales((prev) => prev.filter((s) => s._id !== data.orderId));
    },
  });

  const handleSaleUpdated = () => {
    loadSales();
  };

  const getPaymentStatusBadge = (sale: Sale) => {
    // Si la venta está cancelada, mostrar badge rojo
    if (sale.status === "cancelado") {
      return (
        <Badge
          bg="danger"
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            fontWeight: "500",
          }}
        >
          Pago Cancelado
        </Badge>
      );
    }

    // Si no está cancelada, verificar el saldo
    if (sale.remainingBalance === 0) {
      return (
        <Badge
          bg="success"
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            fontWeight: "500",
          }}
        >
          Completado
        </Badge>
      );
    } else {
      return (
        <Badge
          bg="warning"
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            fontWeight: "500",
          }}
        >
          Pendiente
        </Badge>
      );
    }
  };

  const getStageBadge = (stage: Sale["stage"]) => {
    if (!stage) {
      return (
        <Badge
          bg="secondary"
          style={{
            padding: "6px 12px",
            borderRadius: "20px",
            fontWeight: "500",
          }}
        >
          Sin etapa
        </Badge>
      );
    }

    const backgroundColor = `rgba(${stage.color.r}, ${stage.color.g}, ${stage.color.b}, ${stage.color.a})`;

    return (
      <span
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontWeight: "500",
          backgroundColor: backgroundColor,
          color: "#fff",
          display: "inline-block",
        }}
      >
        {stage.name}
      </span>
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
  const totalBalance = sales.reduce(
    (sum, sale) => sum + (sale.remainingBalance || 0),
    0
  );

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
              <th className="px-4 py-3 fw-semibold text-muted">
                Fecha Entrega
              </th>
              <th className="px-4 py-3 fw-semibold text-muted">
                Estatus Prod.
              </th>
              <th className="px-4 py-3 fw-semibold text-muted">
                Estatus Pago.
              </th>
              <th className="px-4 py-3 fw-semibold text-muted">Fecha Pedido</th>
              <th className="px-4 py-3 fw-semibold text-muted">Pagado</th>
              <th className="px-4 py-3 fw-semibold text-muted">Saldo</th>
              <th className="px-4 py-3 fw-semibold text-muted text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-5 text-muted">
                  No se encontraron ventas de intercambio
                </td>
              </tr>
            ) : (
              sales.map((sale, index) => (
                <tr
                  key={sale._id}
                  style={{ borderBottom: "1px solid #f1f3f5" }}
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    {sale.clientInfo?.name || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    {sale.deliveryData?.deliveryDateTime
                      ? formatDate(sale.deliveryData.deliveryDateTime)
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3">{getStageBadge(sale.stage)}</td>
                  <td className="px-4 py-3">
                    {getPaymentStatusBadge(sale)}
                  </td>
                  <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-3 fw-semibold text-success">
                    ${(sale.advance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 fw-semibold text-danger">
                    ${(sale.remainingBalance || 0).toFixed(2)}
                  </td>
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
            <span className="fw-bold text-success me-5">
              ${totalPaid.toFixed(2)}
            </span>
            <span className="fw-bold text-danger">
              ${totalBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExchangeSalesTable;
