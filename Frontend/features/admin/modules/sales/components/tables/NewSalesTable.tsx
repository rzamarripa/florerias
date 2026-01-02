"use client";

import React, { useEffect, useState } from "react";
import { Table, Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../../services/sales";
import { Sale } from "../../types";
import SaleActions from "../SaleActions";

interface NewSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
  onStatsUpdate?: () => void;
}

const NewSalesTable: React.FC<NewSalesTableProps> = ({
  filters,
  onStatsUpdate,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesService.getNewSales({
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
      });

      if (response.data) {
        setSales(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las ventas nuevas");
      console.error("Error loading new sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [filters]);

  // Socket listeners para actualizaciones en tiempo real
  useOrderSocket({
    filters: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      branchId: filters.branchId,
      status: ["pendiente", "en-proceso", "completado", "sinAnticipo"], // Excluir canceladas
    },
    onOrderCreated: (newOrder) => {
      console.log("🆕 [NewSalesTable] Nueva orden recibida:", newOrder);
      // Agregar la nueva orden al inicio de la lista
      setSales((prev) => {
        const exists = prev.some((s) => s._id === newOrder._id);
        if (exists) {
          console.log("⏭️ [NewSalesTable] Orden ya existe");
          return prev;
        }
        console.log("✅ [NewSalesTable] Agregando nueva orden");
        return [newOrder as Sale, ...prev];
      });
      toast.info(`Nueva venta: ${newOrder.orderNumber || newOrder._id}`);
    },
    onOrderUpdated: (updatedOrder) => {
      setSales((prev) => {
        // Si la orden actualizada debe estar en esta tabla (NO cancelada)
        const shouldInclude = [
          "pendiente",
          "en-proceso",
          "completado",
          "sinAnticipo",
        ].includes(updatedOrder.status);

        if (shouldInclude) {
          // Actualizar o agregar
          const exists = prev.some((s) => s._id === updatedOrder._id);
          if (exists) {
            toast.info(`Venta actualizada: ${updatedOrder.orderNumber}`);
            return prev.map((s) =>
              s._id === updatedOrder._id ? (updatedOrder as Sale) : s
            );
          } else {
            return [updatedOrder as Sale, ...prev];
          }
        } else {
          // Remover si cambió a un estado que no debe estar aquí (ej: cancelado)
          const removedSale = prev.find((s) => s._id === updatedOrder._id);
          if (removedSale && updatedOrder.status === "cancelado") {
            toast.warning(`Venta cancelada: ${updatedOrder.orderNumber}`);
          }
          return prev.filter((s) => s._id !== updatedOrder._id);
        }
      });

      // Actualizar estadísticas después de cualquier cambio
      onStatsUpdate?.();
    },
    onOrderDeleted: (data) => {
      console.log("🗑️ [NewSalesTable] Orden eliminada:", data.orderId);
      setSales((prev) => {
        const deletedSale = prev.find((s) => s._id === data.orderId);
        if (deletedSale) {
          toast.error(`Venta eliminada: ${deletedSale.orderNumber}`);
        }
        return prev.filter((s) => s._id !== data.orderId);
      });
      onStatsUpdate?.();
    },
  });

  const handleSaleUpdated = () => {
    loadSales();
    onStatsUpdate?.();
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
      <Badge
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontWeight: "500",
          backgroundColor: backgroundColor,
          color: "#fff",
        }}
      >
        {stage.name}
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
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
              <th className="px-4 py-3 fw-semibold text-muted">Folio</th>
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
                  No se encontraron ventas nuevas
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale._id}
                  style={{ borderBottom: "1px solid #f1f3f5" }}
                >
                  <td className="px-4 py-3 fw-semibold">{sale.orderNumber}</td>
                  <td className="px-4 py-3">
                    {sale.clientInfo?.name || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    {sale.deliveryData?.deliveryDateTime ? (
                      <div>
                        <div>{formatDate(sale.deliveryData.deliveryDateTime)}</div>
                        <div className="text-muted" style={{ fontSize: "0.85em" }}>
                          {formatTime(sale.deliveryData.deliveryDateTime)}
                        </div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-3">{getStageBadge(sale.stage)}</td>
                  <td className="px-4 py-3">
                    {getPaymentStatusBadge(sale)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div>{formatDate(sale.createdAt)}</div>
                      <div className="text-muted" style={{ fontSize: "0.85em" }}>
                        {formatTime(sale.createdAt)}
                      </div>
                    </div>
                  </td>
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
            <tr
              style={{ background: "#f8f9fa", borderTop: "2px solid #dee2e6" }}
            >
              <td colSpan={8} className="text-end px-4 py-3">
                <span className="fw-bold me-5">Total</span>
                <span className="fw-bold text-success me-5">
                  $
                  {totalPaid.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="fw-bold text-danger">
                  $
                  {totalBalance.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </td>
              <td></td>
            </tr>
          </tbody>
        </Table>
      </div>
    </>
  );
};

export default NewSalesTable;
