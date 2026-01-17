"use client";

import React, { useEffect, useState } from "react";
import { Eye, Edit, Trash2, Printer, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../../services/sales";
import { Sale } from "../../types";
import SaleDetailModal from "../SaleDetailModal";
import { reprintSaleTicket } from "../../utils/reprintSaleTicket";
import { useUserSessionStore } from "@/stores/userSessionStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CancelledSalesTableProps {
  filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  };
}

const CancelledSalesTable: React.FC<CancelledSalesTableProps> = ({
  filters,
}) => {
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
        toast.info(
          `Nueva venta cancelada: ${newOrder.orderNumber || newOrder._id}`
        );
      }
    },
    onOrderUpdated: (updatedOrder) => {
      setSales((prev) => {
        if (updatedOrder.status === "cancelado") {
          // Actualizar o agregar
          const exists = prev.some((s) => s._id === updatedOrder._id);
          if (exists) {
            return prev.map((s) =>
              s._id === updatedOrder._id ? (updatedOrder as Sale) : s
            );
          } else {
            // Agregar venta recien cancelada (toast se muestra desde SalesPage centralizado)
            return [updatedOrder as Sale, ...prev];
          }
        } else {
          // Remover si cambio a otro estado
          return prev.filter((s) => s._id !== updatedOrder._id);
        }
      });
    },
    onOrderDeleted: (data) => {
      setSales((prev) => prev.filter((s) => s._id !== data.orderId));
    },
  });

  const handleDelete = async (saleId: string) => {
    if (!confirm("Estas seguro de eliminar esta venta?")) return;

    try {
      await salesService.deleteSale(saleId);
      toast.success("Venta eliminada exitosamente");
      // No llamar loadSales() - el socket actualizara automaticamente
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

  const getPaymentStatusBadge = (sale: Sale) => {
    // Para ventas canceladas, siempre mostrar badge rojo
    if (sale.status === "cancelado") {
      return (
        <Badge
          variant="destructive"
          className="px-3 py-1 rounded-full font-medium"
        >
          Pago Cancelado
        </Badge>
      );
    }

    // Si no esta cancelada, verificar el saldo (aunque en esta tabla todas deberian estar canceladas)
    if (sale.remainingBalance === 0) {
      return (
        <Badge className="px-3 py-1 rounded-full font-medium bg-green-500 hover:bg-green-500/90 text-white">
          Completado
        </Badge>
      );
    } else {
      return (
        <Badge className="px-3 py-1 rounded-full font-medium bg-yellow-500 hover:bg-yellow-500/90 text-white">
          Pendiente
        </Badge>
      );
    }
  };

  const getStageBadge = (stage: Sale["stage"]) => {
    if (!stage) {
      return (
        <Badge
          variant="secondary"
          className="px-3 py-1 rounded-full font-medium"
        >
          Sin etapa
        </Badge>
      );
    }

    const backgroundColor = `rgba(${stage.color.r}, ${stage.color.g}, ${stage.color.b}, ${stage.color.a})`;

    return (
      <Badge
        className="px-3 py-1 rounded-full font-medium text-white"
        style={{ backgroundColor }}
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
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Cargando ventas...</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">No.</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Clientes</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Fecha Entrega</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Estatus Prod.</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Estatus Pago.</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Fecha Pedido</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Pagado</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Saldo</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                No se encontraron ventas canceladas
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale, index) => (
              <TableRow key={sale._id}>
                <TableCell className="px-4 py-3">{index + 1}</TableCell>
                <TableCell className="px-4 py-3">
                  {sale.clientInfo?.name || "N/A"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {sale.deliveryData?.deliveryDateTime ? (
                    <div>
                      <div>{formatDate(sale.deliveryData.deliveryDateTime)}</div>
                      <div className="text-muted-foreground text-xs">
                        {formatTime(sale.deliveryData.deliveryDateTime)}
                      </div>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">{getStageBadge(sale.stage)}</TableCell>
                <TableCell className="px-4 py-3">
                  {getPaymentStatusBadge(sale)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div>
                    <div>{formatDate(sale.createdAt)}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatTime(sale.createdAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 font-semibold text-green-600">
                  ${(sale.advance || 0).toFixed(2)}
                </TableCell>
                <TableCell className="px-4 py-3 font-semibold text-red-600 text-right">
                  ${(sale.remainingBalance || 0).toFixed(2)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleReprintTicket(sale)}
                      title="Reimprimir ticket"
                    >
                      <Printer size={16} className="text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleOpenDetailModal(sale)}
                      title="Ver detalles"
                    >
                      <Eye size={16} className="text-cyan-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Editar"
                    >
                      <Edit size={16} className="text-yellow-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(sale._id)}
                      title="Eliminar"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="border-t px-4 py-3">
        <div className="flex justify-end">
          <span className="font-bold mr-10">Total</span>
          <span className="font-bold text-green-600 mr-10">
            ${totalPaid.toFixed(2)}
          </span>
          <span className="font-bold text-red-600">
            ${totalBalance.toFixed(2)}
          </span>
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
