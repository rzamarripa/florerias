"use client";

import React, { useEffect, useState } from "react";
import { Table, Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../../services/sales";
import { Sale } from "../../types";
import SaleActions from "../SaleActions";
import { discountAuthService } from "@/features/admin/modules/discount-auth/services/discountAuth";

interface UnauthorizedSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
  onStatsUpdate?: () => void;
}

const UnauthorizedSalesTable: React.FC<UnauthorizedSalesTableProps> = ({
  filters,
  onStatsUpdate,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesService.getUnauthorizedSales({
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
      });

      if (response.data) {
        setSales(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las ventas sin autorizar");
      console.error("Error loading unauthorized sales:", error);
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
    },
    onOrderCreated: (newOrder) => {
      // Si la nueva orden tiene descuento pendiente de autorización, agregarla
      // Esto se puede verificar cuando el backend retorne información adicional
      loadSales();
    },
    onOrderUpdated: (updatedOrder) => {
      // Recargar la lista cuando se actualice una orden
      // (podría haber sido autorizada o rechazada)
      loadSales();
    },
    onOrderDeleted: (data) => {
      setSales((prev) => prev.filter((s) => s._id !== data.orderId));
    },
  });

  const handleSaleUpdated = () => {
    loadSales();
    onStatsUpdate?.();
  };

  const handleRedeemAuthorization = async (
    orderId: string,
    authFolio: string
  ) => {
    const response = await discountAuthService.redeemAuthorizationForOrder(
      orderId,
      authFolio
    );

    if (response.success) {
      toast.success(
        response.message || "Folio canjeado y orden enviada a producción"
      );
      loadSales();
      onStatsUpdate?.();
    }
  };

  const getPaymentStatusBadge = (remainingBalance: number) => {
    if (remainingBalance === 0) {
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

  const getDiscountBadge = (discount: number, discountType: string) => {
    return (
      <Badge
        bg="danger"
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontWeight: "500",
        }}
      >
        {discountType === "porcentaje"
          ? `${discount}%`
          : `$${discount.toFixed(2)}`}
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
  const totalBalance = sales.reduce(
    (sum, sale) => sum + (sale.remainingBalance || 0),
    0
  );
  const totalAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando ventas sin autorizar...</p>
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
              <th className="px-4 py-3 fw-semibold text-muted">Descuento</th>
              <th className="px-4 py-3 fw-semibold text-muted">Estatus Pago</th>
              <th className="px-4 py-3 fw-semibold text-muted">Fecha Pedido</th>
              <th className="px-4 py-3 fw-semibold text-muted">Total</th>
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
                <td colSpan={10} className="text-center py-5 text-muted">
                  No se encontraron ventas sin autorizar
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
                    {sale.deliveryData?.deliveryDateTime
                      ? formatDate(sale.deliveryData.deliveryDateTime)
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    {getDiscountBadge(
                      sale.discount || 0,
                      sale.discountType || "porcentaje"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getPaymentStatusBadge(sale.remainingBalance || 0)}
                  </td>
                  <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-3 fw-semibold">
                    ${(sale.total || 0).toFixed(2)}
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
                      showRedeemFolioAction={true}
                      onRedeemFolio={handleRedeemAuthorization}
                    />
                  </td>
                </tr>
              ))
            )}
            <tr
              style={{ background: "#f8f9fa", borderTop: "2px solid #dee2e6" }}
            >
              <td colSpan={6} className="text-end px-4 py-3">
                <span className="fw-bold me-5">Total</span>
              </td>
              <td className="px-4 py-3">
                <span className="fw-bold">
                  $
                  {totalAmount.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="fw-bold text-success">
                  $
                  {totalPaid.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </td>
              <td className="px-4 py-3">
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

export default UnauthorizedSalesTable;
