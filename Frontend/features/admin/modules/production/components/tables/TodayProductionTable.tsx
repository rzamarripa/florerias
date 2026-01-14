"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Spinner,
  Badge,
  Pagination,
} from "react-bootstrap";
import { Package, Truck, Clock, CheckCircle } from "lucide-react";
import { productionOrdersService } from "../../services/productionOrders";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";

interface TodayProductionTableProps {
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

const TodayProductionTable: React.FC<TodayProductionTableProps> = ({
  branchId,
  onProductionUpdate,
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
    onOrderCreated: (newOrder) => {
      // Si la orden es del día actual y tiene anticipo o está enviada a producción
      const orderDate = new Date(newOrder.deliveryData?.deliveryDateTime);
      const today = new Date();
      if (
        orderDate.toDateString() === today.toDateString() &&
        (newOrder.advance > 0 || newOrder.sendToProduction)
      ) {
        fetchTodayOrders();
      }
    },
    onOrderUpdated: (updatedOrder) => {
      // Actualizar la orden en la lista si está presente
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    },
    onOrderDeleted: (deletedOrderId) => {
      // Eliminar la orden de la lista
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== deletedOrderId)
      );
    },
  });

  useEffect(() => {
    fetchTodayOrders();
  }, [branchId, currentPage]);

  const fetchTodayOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar el servicio de producción que ya filtra correctamente
      const response = await productionOrdersService.getTodayOrders({
        startDate: '', // No necesario, el servicio ya filtra por deliveryDateTime
        endDate: '',   // No necesario, el servicio ya filtra por deliveryDateTime
        branchId,
        limit: 1000,   // Obtener todas las órdenes, la paginación se hace en el cliente
        page: 1
      });

      if (response.data) {
        // Las órdenes ya vienen filtradas por fecha de entrega = HOY
        const allOrders = response.data;

        // Ordenar por hora de entrega
        allOrders.sort((a: Order, b: Order) => {
          const dateA = new Date(a.deliveryData.deliveryDateTime).getTime();
          const dateB = new Date(b.deliveryData.deliveryDateTime).getTime();
          return dateA - dateB;
        });

        // Aplicar paginación manualmente
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedOrders = allOrders.slice(startIndex, endIndex);

        setOrders(paginatedOrders);
        setTotalOrders(allOrders.length);
        setTotalPages(Math.ceil(allOrders.length / limit));
      }
    } catch (err: any) {
      console.error("Error fetching today production:", err);
      setError(err.message || "Error al cargar las órdenes de hoy");
      toast.error("Error al cargar las órdenes de producción");
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
        return <Truck size={16} className="text-primary" />;
      case "tienda":
        return <Package size={16} className="text-success" />;
      default:
        return <Package size={16} className="text-secondary" />;
    }
  };

  const getShippingLabel = (shippingType: string) => {
    switch (shippingType) {
      case "envio":
        return "Envío";
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
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando órdenes de hoy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <p className="text-danger">{error}</p>
        <Button variant="primary" size="sm" onClick={fetchTodayOrders}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-5">
        <Clock size={48} className="text-muted mb-3" />
        <h5 className="text-muted">No hay órdenes programadas para hoy</h5>
        <p className="text-muted">
          Las órdenes con fecha de entrega para hoy aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">Producción del Día</h5>
          <small className="text-muted">
            {orders.length} órden(es) para hoy
          </small>
        </div>
      </div>

      <Table responsive hover className="align-middle">
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={{ width: "40px" }}>No.</th>
            <th>Folio</th>
            <th>Hora Entrega</th>
            <th>Cliente</th>
            <th>Descripción</th>
            <th className="text-center">Entregar En</th>
            <th className="text-center">Forma Entrega</th>
            <th>Comentario</th>
            <th className="text-end">Precio</th>
            <th>Vendedor</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={order._id}>
              <td className="text-muted">{index + 1}</td>
              <td>
                <span className="fw-semibold">{order.orderNumber}</span>
              </td>
              <td>
                <Badge bg="info" className="text-white">
                  <Clock size={12} className="me-1" />
                  {formatDeliveryTime(order.deliveryData.deliveryDateTime)}
                </Badge>
              </td>
              <td>
                <div>
                  <div className="fw-semibold">{order.clientInfo.name}</div>
                  {order.clientInfo.phone && (
                    <small className="text-muted">
                      {order.clientInfo.phone}
                    </small>
                  )}
                </div>
              </td>
              <td>
                <div style={{ maxWidth: "300px" }}>
                  <small>{formatDescription(order.items)}</small>
                </div>
              </td>
              <td className="text-center">
                <div className="d-flex align-items-center justify-content-center gap-1">
                  {getShippingIcon(order.shippingType)}
                  <span>{getShippingLabel(order.shippingType)}</span>
                </div>
              </td>
              <td className="text-center">
                {order.deliveryData.neighborhoodId ? (
                  <span>
                    {order.deliveryData.neighborhoodId.name || "Colonia"}
                  </span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td>
                <div style={{ maxWidth: "200px" }}>
                  <small className="text-muted">
                    {order.deliveryData.message || "-"}
                  </small>
                </div>
              </td>
              <td className="text-end">
                <div>
                  <div className="fw-semibold">
                    {formatCurrency(order.total)}
                  </div>
                  {order.remainingBalance > 0 && (
                    <small className="text-warning">
                      Saldo: {formatCurrency(order.remainingBalance)}
                    </small>
                  )}
                </div>
              </td>
              <td>
                {order.cashier ? (
                  <small>{order.cashier.name || "Usuario"}</small>
                ) : (
                  <small className="text-muted">-</small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <small className="text-muted">
              Mostrando {(currentPage - 1) * limit + 1} a{" "}
              {Math.min(currentPage * limit, totalOrders)} de {totalOrders}{" "}
              órdenes
            </small>
          </div>
          <Pagination className="mb-0">
            <Pagination.First
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            />

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <Pagination.Item
                  key={pageNumber}
                  active={pageNumber === currentPage}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Pagination.Item>
              );
            })}

            {totalPages > 5 && <Pagination.Ellipsis />}

            <Pagination.Next
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => setTotalPages(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TodayProductionTable;
