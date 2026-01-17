"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../../services/sales";
import { Sale } from "../../types";
import SaleActions from "../SaleActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
      status: ["pendiente", "en-proceso", "completado", "sinAnticipo"], // Incluir ventas sin anticipo
    },
    onOrderCreated: (newOrder) => {
      console.log("[NewSalesTable] Nueva orden recibida:", newOrder);
      // Agregar la nueva orden al inicio de la lista
      setSales((prev) => {
        const exists = prev.some((s) => s._id === newOrder._id);
        if (exists) {
          console.log("[NewSalesTable] Orden ya existe");
          return prev;
        }
        console.log("[NewSalesTable] Agregando nueva orden");
        return [newOrder as Sale, ...prev];
      });
      toast.info(`Nueva venta: ${newOrder.orderNumber || newOrder._id}`);
    },
    onOrderUpdated: (updatedOrder) => {
      setSales((prev) => {
        // Si la orden actualizada debe estar en esta tabla (incluir sinAnticipo, excluir canceladas)
        const shouldInclude = [
          "pendiente",
          "en-proceso",
          "completado",
          "sinAnticipo", // Incluir ventas sin anticipo
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
          // Remover si cambio a un estado que no debe estar aqui (ej: cancelado)
          const removedSale = prev.find((s) => s._id === updatedOrder._id);
          if (removedSale && updatedOrder.status === "cancelado") {
            toast.warning(`Venta cancelada: ${updatedOrder.orderNumber}`);
          }
          return prev.filter((s) => s._id !== updatedOrder._id);
        }
      });

      // Actualizar estadisticas despues de cualquier cambio
      onStatsUpdate?.();
    },
    onOrderDeleted: (data) => {
      console.log("[NewSalesTable] Orden eliminada:", data.orderId);
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
    // Si la venta esta cancelada, mostrar badge rojo
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

    // Si no esta cancelada, verificar el saldo
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
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Folio</TableHead>
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
                No se encontraron ventas nuevas
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <TableRow key={sale._id}>
                <TableCell className="px-4 py-3 font-semibold">{sale.orderNumber}</TableCell>
                <TableCell className="px-4 py-3">
                  {sale.clientInfo?.name || "N/A"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {sale.deliveryData?.deliveryDateTime ? (
                    <div>
                      <div>
                        {formatDate(sale.deliveryData.deliveryDateTime)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatTime(sale.deliveryData.deliveryDateTime)}
                      </div>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">{getStageBadge(sale.stage)}</TableCell>
                <TableCell className="px-4 py-3">{getPaymentStatusBadge(sale)}</TableCell>
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
                <TableCell className="px-4 py-3 font-semibold text-red-600">
                  ${(sale.remainingBalance || 0).toFixed(2)}
                </TableCell>
                <TableCell className="px-4 py-3 text-center">
                  <SaleActions
                    sale={sale}
                    onSaleUpdated={handleSaleUpdated}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
          <TableRow className="bg-muted/50 border-t-2">
            <TableCell colSpan={8} className="text-right px-4 py-3">
              <span className="font-bold mr-10">Total</span>
              <span className="font-bold text-green-600 mr-10">
                $
                {totalPaid.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="font-bold text-red-600">
                $
                {totalBalance.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};

export default NewSalesTable;
