"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, CalendarDays, Loader2 } from "lucide-react";
import { salesService } from "../../../sales/services/sales";
import { toast } from "react-toastify";

interface FutureProductionTableProps {
  branchId?: string;
  onProductionUpdate?: () => void;
}

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  isProduct: boolean;
  productId?: any;
  productCategory?: any;
  insumos?: any[];
}

interface Order {
  _id: string;
  orderNumber: string;
  clientInfo: {
    name: string;
    phone?: string;
    email?: string;
  };
  items: OrderItem[];
  deliveryData: {
    recipientName: string;
    deliveryDateTime: string;
    message?: string;
    street?: string;
    neighborhoodId?: any;
    deliveryPrice?: number;
    reference?: string;
  };
  shippingType: 'envio' | 'tienda' | 'redes_sociales';
  salesChannel: string;
  total: number;
  subtotal: number;
  discount: number;
  advance: number;
  remainingBalance: number;
  status: string;
  stage?: any;
  branchId: any;
  createdAt: string;
  updatedAt: string;
  cashier?: any;
  paymentMethod?: any;
  sendToProduction: boolean;
  sentToShipping: boolean;
  comprobanteUrl?: string;
  arregloUrl?: string;
}

const FutureProductionTable: React.FC<FutureProductionTableProps> = ({
  branchId,
  onProductionUpdate,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFutureOrders();
  }, [branchId]);

  const fetchFutureOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener fecha de pasado manana (2 dias desde hoy)
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 2);
      futureStart.setHours(0, 0, 0, 0);

      // Obtener ordenes de los proximos 30 dias (ajustable)
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 30);
      futureEnd.setHours(23, 59, 59, 999);

      // Obtener todas las ordenes del rango
      const response = await salesService.getAllSales({
        startDate: new Date().toISOString().split("T")[0], // Desde hoy
        endDate: futureEnd.toISOString().split("T")[0], // Hasta 30 dias
        branchId,
        limit: 200,
      });

      if (response.data) {
        // Filtrar ordenes por fecha de entrega (deliveryDateTime) despues de manana
        const filteredOrders = response.data.filter((order: Order) => {
          if (!order.deliveryData?.deliveryDateTime) return false;

          const deliveryDate = new Date(order.deliveryData.deliveryDateTime);
          const isFuture = deliveryDate >= futureStart;

          // Excluir ordenes canceladas o sin anticipo
          const isValidStatus = order.status !== 'cancelado' && order.status !== 'sinAnticipo';

          return isFuture && isValidStatus && (order.sendToProduction || order.advance > 0);
        });

        // Ordenar por fecha y hora de entrega
        filteredOrders.sort((a: Order, b: Order) => {
          const dateA = new Date(a.deliveryData.deliveryDateTime).getTime();
          const dateB = new Date(b.deliveryData.deliveryDateTime).getTime();
          return dateA - dateB;
        });

        setOrders(filteredOrders);
      }
    } catch (err: any) {
      console.error("Error fetching future production:", err);
      setError(err.message || "Error al cargar las ordenes futuras");
      toast.error("Error al cargar las ordenes de produccion futura");
    } finally {
      setLoading(false);
    }
  };

  const formatDeliveryDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString("es-MX", {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
    const timeStr = date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getShippingIcon = (shippingType: string) => {
    switch (shippingType) {
      case "envio":
        return <Truck size={16} className="text-blue-500" />;
      case "tienda":
        return <Package size={16} className="text-green-500" />;
      default:
        return <Package size={16} className="text-gray-500" />;
    }
  };

  const getShippingLabel = (shippingType: string) => {
    switch (shippingType) {
      case "envio":
        return "Envio";
      case "tienda":
        return "Tienda";
      case "redes_sociales":
        return "Redes";
      default:
        return shippingType;
    }
  };

  const formatDescription = (items: OrderItem[]) => {
    return items.map((item) =>
      `${item.productName}${item.quantity > 1 ? ` (${item.quantity})` : ''}`
    ).join(", ");
  };

  const getDaysFromToday = (dateTime: string) => {
    const deliveryDate = new Date(dateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deliveryDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(deliveryDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-3 text-muted-foreground">Cargando ordenes futuras...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="default" size="sm" onClick={fetchFutureOrders} className="mt-2">
          Reintentar
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays size={48} className="text-muted-foreground mb-3 mx-auto" />
        <h5 className="text-muted-foreground font-medium">No hay ordenes programadas para los proximos dias</h5>
        <p className="text-muted-foreground">Las ordenes con fecha de entrega despues de manana apareceran aqui</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-between items-center">
        <div>
          <h5 className="mb-0 font-medium">Produccion Futura</h5>
          <small className="text-muted-foreground">{orders.length} orden(es) programadas</small>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFutureOrders}>
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">No.</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead className="text-center">Entregar En</TableHead>
              <TableHead className="text-center">Forma Entrega</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Vendedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => {
              const daysFromToday = getDaysFromToday(order.deliveryData.deliveryDateTime);

              return (
                <TableRow
                  key={order._id}
                  className={
                    daysFromToday <= 3
                      ? "bg-red-50"
                      : daysFromToday <= 7
                        ? "bg-purple-50"
                        : ""
                  }
                >
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <span className="font-semibold">{order.orderNumber}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge
                        variant={daysFromToday <= 3 ? "destructive" : daysFromToday <= 7 ? "secondary" : "outline"}
                      >
                        <CalendarDays size={12} className="mr-1" />
                        {formatDeliveryDateTime(order.deliveryData.deliveryDateTime)}
                      </Badge>
                      <div>
                        <small className="text-muted-foreground">En {daysFromToday} dias</small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{order.clientInfo.name}</div>
                      {order.clientInfo.phone && (
                        <small className="text-muted-foreground">{order.clientInfo.phone}</small>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <small>{formatDescription(order.items)}</small>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getShippingIcon(order.shippingType)}
                      <span>{getShippingLabel(order.shippingType)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {order.deliveryData.neighborhoodId ? (
                      <span>{order.deliveryData.neighborhoodId.name || "Colonia"}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <small className="text-muted-foreground">
                        {order.deliveryData.message || "-"}
                      </small>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-semibold">{formatCurrency(order.total)}</div>
                      {order.remainingBalance > 0 && (
                        <small className="text-yellow-600">
                          Saldo: {formatCurrency(order.remainingBalance)}
                        </small>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.cashier ? (
                      <small>{order.cashier.name || "Usuario"}</small>
                    ) : (
                      <small className="text-muted-foreground">-</small>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FutureProductionTable;
