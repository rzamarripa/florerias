"use client";

import React, { useEffect, useState } from "react";
import { Table, Badge, Button, Spinner } from "react-bootstrap";
import { Eye, Edit, Trash2, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../services/sales";
import { Sale } from "../types";
import SaleDetailModal from "./SaleDetailModal";
import { reprintSaleTicket } from "../utils/reprintSaleTicket";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface CancelledSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
}

const CancelledSalesTable: React.FC<CancelledSalesTableProps> = ({ filters }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { user } = useUserSessionStore();

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesService.getCancelledSales({
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
      });

      if (response.data) {
        setSales(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las ventas canceladas");
      console.error("Error loading cancelled sales:", error);
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
      // No filtrar por status en el socket para recibir TODAS las actualizaciones
    },
    onOrderCreated: (newOrder) => {
      // Agregar si es cancelada
      if (newOrder.status === "cancelado") {
        setSales((prev) => {
          const exists = prev.some((s) => s._id === newOrder._id);
          if (exists) return prev;
          return [newOrder as Sale, ...prev];
        });
        toast.info(`Nueva venta cancelada: ${newOrder.orderNumber || newOrder._id}`);
      }
    },
    onOrderUpdated: (updatedOrder) => {
      setSales((prev) => {
        if (updatedOrder.status === "cancelado") {
          // Actualizar o agregar
          const exists = prev.some((s) => s._id === updatedOrder._id);
          if (exists) {
            return prev.map((s) => (s._id === updatedOrder._id ? updatedOrder as Sale : s));
          } else {
            // Agregar venta recién cancelada
            toast.info(`Venta cancelada: ${updatedOrder.orderNumber || updatedOrder._id}`);
            return [updatedOrder as Sale, ...prev];
          }
        } else {
          // Remover si cambió a otro estado
          return prev.filter((s) => s._id !== updatedOrder._id);
        }
      });
    },
    onOrderDeleted: (data) => {
      setSales((prev) => prev.filter((s) => s._id !== data.orderId));
    },
  });

  const handleDelete = async (saleId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta venta?")) return;

    try {
      await salesService.deleteSale(saleId);
      toast.success("Venta eliminada exitosamente");
      // No llamar loadSales() - el socket actualizará automáticamente
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la venta");
    }
  };

  const handleReprintTicket = async (sale: Sale) => {
    await reprintSaleTicket(sale, user?.profile?.fullName);
  };

  const handleOpenDetailModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSale(null);
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
                  No se encontraron ventas canceladas
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
                  <td className="px-4 py-3">{getStageBadge(sale.stage)}</td>
                  <td className="px-4 py-3">{getPaymentStatusBadge(sale.remainingBalance || 0)}</td>
                  <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-3 fw-semibold text-success">${(sale.advance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 fw-semibold text-danger">${(sale.remainingBalance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleReprintTicket(sale)}
                        className="border-0"
                        style={{ borderRadius: "8px" }}
                        title="Reimprimir ticket"
                      >
                        <Printer size={16} className="text-primary" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleOpenDetailModal(sale)}
                        className="border-0"
                        style={{ borderRadius: "8px" }}
                        title="Ver detalles"
                      >
                        <Eye size={16} className="text-info" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="border-0"
                        style={{ borderRadius: "8px" }}
                        title="Editar"
                      >
                        <Edit size={16} className="text-warning" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleDelete(sale._id)}
                        className="border-0"
                        style={{ borderRadius: "8px" }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} className="text-danger" />
                      </Button>
                    </div>
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

      {/* Sale Detail Modal */}
      <SaleDetailModal
        show={showDetailModal}
        onHide={handleCloseDetailModal}
        sale={selectedSale}
      />
    </>
  );
};

export default CancelledSalesTable;
