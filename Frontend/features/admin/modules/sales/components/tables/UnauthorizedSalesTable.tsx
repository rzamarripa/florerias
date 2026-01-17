"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { salesService } from "../../services/sales";
import { Sale } from "../../types";
import SaleActions from "../SaleActions";
import { discountAuthService } from "@/features/admin/modules/discount-auth/services/discountAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
      console.log(
        "[UnauthorizedSalesTable] Nueva orden recibida:",
        newOrder
      );

      // Si la nueva orden tiene descuento (discount > 0), agregarla optimisticamente
      // El backend ya creo el DiscountAuth antes de emitir el socket
      if (newOrder.discount && newOrder.discount > 0) {
        console.log("Orden con descuento detectada, agregando a la tabla");
        setSales((prev) => {
          const exists = prev.some((s) => s._id === newOrder._id);
          if (exists) return prev;
          return [newOrder as Sale, ...prev];
        });
        toast.info(
          `Nueva venta con descuento: ${newOrder.orderNumber || newOrder._id}`
        );
      }
    },
    onOrderUpdated: (updatedOrder) => {
      console.log(
        "[UnauthorizedSalesTable] Orden actualizada:",
        updatedOrder
      );

      // Verificar si la orden debe estar en "Por Autorizar"
      // Debe tener descuento > 0 Y NO haber sido enviada a produccion (canjeada) Y NO estar cancelada
      const hasDiscount = updatedOrder.discount && updatedOrder.discount > 0;
      const wasSentToProduction = updatedOrder.sendToProduction === true;
      const wasCancelled = updatedOrder.status === "cancelado";
      const shouldInclude =
        hasDiscount && !wasSentToProduction && !wasCancelled;

      setSales((prev) => {
        const exists = prev.some((s) => s._id === updatedOrder._id);

        if (shouldInclude) {
          // Actualizar o agregar
          if (exists) {
            console.log("Actualizando orden en tabla Por Autorizar");
            return prev.map((s) =>
              s._id === updatedOrder._id ? (updatedOrder as Sale) : s
            );
          } else {
            console.log("Agregando orden a tabla Por Autorizar");
            return [updatedOrder as Sale, ...prev];
          }
        } else {
          // Remover si fue canjeada, cancelada o ya no tiene descuento
          if (exists) {
            if (wasSentToProduction) {
              console.log(
                "Descuento canjeado - Removiendo de Por Autorizar:",
                updatedOrder.orderNumber
              );
              toast.success(
                `Folio de descuento canjeado para orden ${updatedOrder.orderNumber}. Enviada a produccion.`,
                {
                  autoClose: 5000,
                }
              );
            } else if (wasCancelled) {
              console.log(
                "Descuento rechazado - Orden cancelada:",
                updatedOrder.orderNumber
              );
              toast.error(
                `Descuento rechazado para orden ${updatedOrder.orderNumber}. La orden fue cancelada.`,
                {
                  autoClose: 5000,
                }
              );
            } else {
              console.log(
                "Orden sin descuento - Removiendo de Por Autorizar"
              );
            }
          }
          return prev.filter((s) => s._id !== updatedOrder._id);
        }
      });

      // Actualizar estadisticas cuando cambia una orden
      if (wasSentToProduction || wasCancelled) {
        onStatsUpdate?.();
      }
    },
    onOrderDeleted: (data) => {
      console.log("[UnauthorizedSalesTable] Orden eliminada:", data.orderId);
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
        response.message || "Folio canjeado y orden enviada a produccion"
      );
      loadSales();
      onStatsUpdate?.();
    }
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

  const getDiscountBadge = (sale: Sale) => {
    const { discount, discountType, subtotal } = sale;

    // Calcular el monto del descuento
    let discountAmount = 0;
    if (discountType === "porcentaje") {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    return (
      <Badge
        variant="destructive"
        className="px-3 py-1 rounded-full font-medium"
      >
        {discountType === "porcentaje"
          ? `${discount}% / $${discountAmount.toFixed(2)}`
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
  const totalAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Cargando ventas sin autorizar...</p>
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
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Descuento</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Estatus Pago</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Fecha Pedido</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Total</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Pagado</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground">Saldo</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                No se encontraron ventas sin autorizar
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
                <TableCell className="px-4 py-3">{getDiscountBadge(sale)}</TableCell>
                <TableCell className="px-4 py-3">{getPaymentStatusBadge(sale)}</TableCell>
                <TableCell className="px-4 py-3">
                  <div>
                    <div>{formatDate(sale.createdAt)}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatTime(sale.createdAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 font-semibold">
                  ${(sale.total || 0).toFixed(2)}
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
                    showRedeemFolioAction={true}
                    onRedeemFolio={handleRedeemAuthorization}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
          <TableRow className="bg-muted/50 border-t-2">
            <TableCell colSpan={6} className="text-right px-4 py-3">
              <span className="font-bold mr-10">Total</span>
            </TableCell>
            <TableCell className="px-4 py-3">
              <span className="font-bold">
                $
                {totalAmount.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </TableCell>
            <TableCell className="px-4 py-3">
              <span className="font-bold text-green-600">
                $
                {totalPaid.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </TableCell>
            <TableCell className="px-4 py-3">
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

export default UnauthorizedSalesTable;
