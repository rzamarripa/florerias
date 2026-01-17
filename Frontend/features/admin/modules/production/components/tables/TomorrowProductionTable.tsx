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
import { Package, Truck, Clock, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import { productionOrdersService } from "../../services/productionOrders";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";

interface TomorrowProductionTableProps {
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
  shippingType: "envio" | "tienda" | "redes_sociales";
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

const TomorrowProductionTable: React.FC<TomorrowProductionTableProps> = ({
  branchId,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const limit = 10;

  // Socket listener para actualizaciones en tiempo real
  useOrderSocket({
    filters: {},
    onOrderCreated: (newOrder: any) => {
      // Si la orden es del dia siguiente y tiene anticipo o esta enviada a produccion
      const orderDate = new Date(newOrder.deliveryData?.deliveryDateTime);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (
        orderDate.toDateString() === tomorrow.toDateString() &&
        (newOrder.advance > 0 || newOrder.sendToProduction)
      ) {
        fetchTomorrowOrders();
      }
    },
    onOrderUpdated: (updatedOrder: any) => {
      // Actualizar la orden en la lista si esta presente
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    },
    onOrderDeleted: (deletedOrderId: string) => {
      // Eliminar la orden de la lista
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== deletedOrderId)
      );
    },
  });

  useEffect(() => {
    fetchTomorrowOrders();
  }, [branchId, currentPage]);

  const fetchTomorrowOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar el servicio de produccion que ya filtra correctamente
      const response = await productionOrdersService.getTomorrowOrders({
        startDate: '', // No necesario, el servicio ya filtra por deliveryDateTime
        endDate: '',   // No necesario, el servicio ya filtra por deliveryDateTime
        branchId,
        limit: 1000,   // Obtener todas las ordenes, la paginacion se hace en el cliente
        page: 1
      });

      if (response.data) {
        // Las ordenes ya vienen filtradas por fecha de entrega = MANANA
        const allOrders = response.data;

        // Ordenar por hora de entrega
        allOrders.sort((a: any, b: any) => {
          const dateA = new Date(a.deliveryData.deliveryDateTime).getTime();
          const dateB = new Date(b.deliveryData.deliveryDateTime).getTime();
          return dateA - dateB;
        });

        // Aplicar paginacion manualmente
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedOrders = allOrders.slice(startIndex, endIndex);

        setOrders(paginatedOrders);
        setTotalOrders(allOrders.length);
        setTotalPages(Math.ceil(allOrders.length / limit));
      }
    } catch (err: any) {
      console.error("Error fetching tomorrow production:", err);
      setError(err.message || "Error al cargar las ordenes de manana");
      toast.error("Error al cargar las ordenes de produccion");
    } finally {
      setLoading(false);
    }
  };

  const formatDeliveryTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    return items
      .map(
        (item) =>
          `${item.productName}${item.quantity > 1 ? ` (${item.quantity})` : ""}`
      )
      .join(", ");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-3 text-muted-foreground">Cargando ordenes de manana...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="default" size="sm" onClick={fetchTomorrowOrders} className="mt-2">
          Reintentar
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="text-muted-foreground mb-3 mx-auto" />
        <h5 className="text-muted-foreground font-medium">No hay ordenes programadas para manana</h5>
        <p className="text-muted-foreground">
          Las ordenes con fecha de entrega para manana apareceran aqui
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-between items-center">
        <div>
          <h5 className="mb-0 font-medium">Produccion de Manana</h5>
          <small className="text-muted-foreground">
            {totalOrders} orden(es) para manana
          </small>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">No.</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead>Hora Entrega</TableHead>
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
            {orders.map((order, index) => (
              <TableRow key={order._id}>
                <TableCell className="text-muted-foreground">
                  {(currentPage - 1) * limit + index + 1}
                </TableCell>
                <TableCell>
                  <span className="font-semibold">{order.orderNumber}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Clock size={12} className="mr-1" />
                    {formatDeliveryTime(order.deliveryData.deliveryDateTime)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-semibold">{order.clientInfo.name}</div>
                    {order.clientInfo.phone && (
                      <small className="text-muted-foreground">
                        {order.clientInfo.phone}
                      </small>
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
                    <span>
                      {order.deliveryData.neighborhoodId.name || "Colonia"}
                    </span>
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
                    <div className="font-semibold">
                      {formatCurrency(order.total)}
                    </div>
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginacion */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3">
          <div>
            <small className="text-muted-foreground">
              Mostrando {(currentPage - 1) * limit + 1} a{" "}
              {Math.min(currentPage * limit, totalOrders)} de {totalOrders}{" "}
              ordenes
            </small>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}

            {totalPages > 5 && (
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TomorrowProductionTable;
