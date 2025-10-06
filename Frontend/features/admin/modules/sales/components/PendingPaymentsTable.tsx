"use client";

import React, { useEffect, useState } from "react";
import { Table, Badge, Button, Spinner } from "react-bootstrap";
import { Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { salesService } from "../services/sales";
import { Sale } from "../types";

interface PendingPaymentsTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
  };
}

const PendingPaymentsTable: React.FC<PendingPaymentsTableProps> = ({ filters }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesService.getPendingSales({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      if (response.data) {
        setSales(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los pagos pendientes");
      console.error("Error loading pending sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [filters]);

  const handleDelete = async (saleId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta venta?")) return;

    try {
      await salesService.deleteSale(saleId);
      toast.success("Venta eliminada exitosamente");
      loadSales();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la venta");
    }
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
                  No se encontraron pagos pendientes
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
                  <td className="px-4 py-3">
                    <div className="d-flex justify-content-center gap-2">
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

export default PendingPaymentsTable;
