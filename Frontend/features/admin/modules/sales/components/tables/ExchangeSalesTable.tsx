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
      // Solo agregar si usa el metodo de pago de intercambio
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

      // Incluir solo si: es el metodo de intercambio Y NO esta cancelada
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
          // Remover si cambio de metodo de pago O fue cancelada
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
                No se encontraron ventas de intercambio
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
    </>
  );
};

export default ExchangeSalesTable;
