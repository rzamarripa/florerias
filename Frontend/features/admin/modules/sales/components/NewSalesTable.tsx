"use client";

import React, { useEffect, useState } from "react";
import { Table, Badge, Button, Spinner } from "react-bootstrap";
import { Eye, Edit, Trash2, DollarSign } from "lucide-react";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../services/sales";
import { Sale } from "../types";
import PaymentModal from "./PaymentModal";

interface NewSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
}

const NewSalesTable: React.FC<NewSalesTableProps> = ({ filters }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
      status: ["pendiente", "en-proceso", "completado"], // Excluir canceladas
    },
    onOrderCreated: (newOrder) => {
      // Agregar la nueva orden al inicio de la lista
      setSales((prev) => {
        const exists = prev.some((s) => s._id === newOrder._id);
        if (exists) return prev;
        return [newOrder as Sale, ...prev];
      });
      toast.info(`Nueva venta: ${newOrder.orderNumber || newOrder._id}`);
    },
    onOrderUpdated: (updatedOrder) => {
      setSales((prev) => {
        // Si la orden actualizada debe estar en esta tabla
        const shouldInclude = ["pendiente", "en-proceso", "completado"].includes(updatedOrder.status);

        if (shouldInclude) {
          // Actualizar o agregar
          const exists = prev.some((s) => s._id === updatedOrder._id);
          if (exists) {
            return prev.map((s) => (s._id === updatedOrder._id ? updatedOrder as Sale : s));
          } else {
            return [updatedOrder as Sale, ...prev];
          }
        } else {
          // Remover si cambió a un estado que no debe estar aquí (ej: cancelado)
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

  const handleOpenPaymentModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSale(null);
  };

  const handlePaymentAdded = () => {
    // Recargar las ventas para reflejar los cambios
    loadSales();
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
              <th className="px-4 py-3 fw-semibold text-muted">Folio</th>
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
                  No se encontraron ventas nuevas
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <td className="px-4 py-3 fw-semibold">{sale.orderNumber}</td>
                  <td className="px-4 py-3">{sale.clientInfo?.name || "N/A"}</td>
                  <td className="px-4 py-3">
                    {sale.deliveryData?.deliveryDateTime ? formatDate(sale.deliveryData.deliveryDateTime) : "N/A"}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(sale.status)}</td>
                  <td className="px-4 py-3">{getStatusBadge(sale.status)}</td>
                  <td className="px-4 py-3">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-3 fw-semibold text-success">${(sale.advance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 fw-semibold text-danger">${(sale.remainingBalance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleOpenPaymentModal(sale)}
                        className="border-0"
                        style={{ borderRadius: "8px" }}
                        title="Gestionar pagos"
                      >
                        <DollarSign size={16} className="text-success" />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
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

      {/* Total Row */}
      <div className="border-top px-4 py-3">
        <div className="row">
          <div className="col text-end">
            <span className="fw-bold me-5">Total</span>
            <span className="fw-bold text-success me-5">${totalPaid.toFixed(2)}</span>
            <span className="fw-bold text-danger">${totalBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedSale && (
        <PaymentModal
          show={showPaymentModal}
          onHide={handleClosePaymentModal}
          sale={selectedSale}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </>
  );
};

export default NewSalesTable;
