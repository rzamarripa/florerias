"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Form, Spinner, Badge } from "react-bootstrap";
import { Package, Truck, Clock, CalendarDays } from "lucide-react";
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

      // Obtener fecha de pasado mañana (2 días desde hoy)
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 2);
      futureStart.setHours(0, 0, 0, 0);
      
      // Obtener órdenes de los próximos 30 días (ajustable)
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 30);
      futureEnd.setHours(23, 59, 59, 999);

      // Obtener todas las órdenes del rango
      const response = await salesService.getAllSales({
        startDate: new Date().toISOString().split("T")[0], // Desde hoy
        endDate: futureEnd.toISOString().split("T")[0], // Hasta 30 días
        branchId,
        limit: 200,
      });

      if (response.data) {
        // Filtrar órdenes por fecha de entrega (deliveryDateTime) después de mañana
        const filteredOrders = response.data.filter((order: Order) => {
          if (!order.deliveryData?.deliveryDateTime) return false;
          
          const deliveryDate = new Date(order.deliveryData.deliveryDateTime);
          const isFuture = deliveryDate >= futureStart;
          
          // Excluir órdenes canceladas o sin anticipo
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
      setError(err.message || "Error al cargar las órdenes futuras");
      toast.error("Error al cargar las órdenes de producción futura");
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
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando órdenes futuras...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <p className="text-danger">{error}</p>
        <Button variant="primary" size="sm" onClick={fetchFutureOrders}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-5">
        <CalendarDays size={48} className="text-muted mb-3" />
        <h5 className="text-muted">No hay órdenes programadas para los próximos días</h5>
        <p className="text-muted">Las órdenes con fecha de entrega después de mañana aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">Producción Futura</h5>
          <small className="text-muted">{orders.length} órden(es) programadas</small>
        </div>
        <Button variant="outline-primary" size="sm" onClick={fetchFutureOrders}>
          Actualizar
        </Button>
      </div>

      <Table responsive hover className="align-middle">
        <thead>
          <tr style={{ backgroundColor: "#f8f9fa" }}>
            <th style={{ width: "40px" }}>No.</th>
            <th>Folio</th>
            <th>Fecha y Hora</th>
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
          {orders.map((order, index) => {
            const daysFromToday = getDaysFromToday(order.deliveryData.deliveryDateTime);
            const rowColor = daysFromToday <= 3 ? "#ffebee" : daysFromToday <= 7 ? "#f3e5f5" : "white";
            
            return (
              <tr key={order._id} style={{ backgroundColor: rowColor }}>
                <td className="text-muted">{index + 1}</td>
                <td>
                  <span className="fw-semibold">{order.orderNumber}</span>
                </td>
                <td>
                  <div>
                    <Badge 
                      bg={daysFromToday <= 3 ? "danger" : daysFromToday <= 7 ? "secondary" : "light"} 
                      className={daysFromToday > 7 ? "text-dark" : "text-white"}
                    >
                      <CalendarDays size={12} className="me-1" />
                      {formatDeliveryDateTime(order.deliveryData.deliveryDateTime)}
                    </Badge>
                    <div>
                      <small className="text-muted">En {daysFromToday} días</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div className="fw-semibold">{order.clientInfo.name}</div>
                    {order.clientInfo.phone && (
                      <small className="text-muted">{order.clientInfo.phone}</small>
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
                    <span>{order.deliveryData.neighborhoodId.name || "Colonia"}</span>
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
                    <div className="fw-semibold">{formatCurrency(order.total)}</div>
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
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default FutureProductionTable;