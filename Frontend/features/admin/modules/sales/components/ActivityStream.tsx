"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  DollarSign,
  X,
  XCircle,
  ArrowRight,
  RefreshCw,
  Truck,
  CheckCircle,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Award,
  Clock,
  Loader2,
} from "lucide-react";
import { OrderLog, OrderEventType } from "../types/orderLog";
import { orderLogsService } from "../services/orderLogs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityStreamProps {
  orderId: string;
}

const ActivityStream: React.FC<ActivityStreamProps> = ({ orderId }) => {
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [orderId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderLogsService.getOrderLogs(orderId, {
        limit: 100, // Cargar todos los logs sin paginacion
      });
      setLogs(response.data);
    } catch (err: any) {
      console.error("Error al cargar logs:", err);
      setError(
        err.response?.data?.message ||
          "Error al cargar el historial de movimientos"
      );
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: OrderEventType) => {
    const iconProps = { size: 18 };

    switch (eventType) {
      case "order_created":
        return <Package {...iconProps} />;
      case "payment_received":
        return <DollarSign {...iconProps} />;
      case "payment_deleted":
        return <X {...iconProps} />;
      case "order_cancelled":
        return <XCircle {...iconProps} />;
      case "stage_changed":
        return <ArrowRight {...iconProps} />;
      case "status_changed":
        return <RefreshCw {...iconProps} />;
      case "sent_to_shipping":
        return <Truck {...iconProps} />;
      case "order_completed":
        return <CheckCircle {...iconProps} />;
      case "discount_requested":
        return <Tag {...iconProps} />;
      case "discount_approved":
        return <ThumbsUp {...iconProps} />;
      case "discount_rejected":
        return <ThumbsDown {...iconProps} />;
      case "discount_redeemed":
        return <Award {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const getEventColor = (eventType: OrderEventType): string => {
    switch (eventType) {
      case "order_created":
      case "payment_received":
      case "order_completed":
      case "discount_approved":
      case "discount_redeemed":
        return "#1ABC9C"; // Verde
      case "stage_changed":
      case "status_changed":
      case "sent_to_shipping":
        return "#3498DB"; // Azul
      case "discount_requested":
        return "#F39C12"; // Naranja
      case "payment_deleted":
      case "order_cancelled":
      case "discount_rejected":
        return "#E74C3C"; // Rojo
      default:
        return "#95A5A6"; // Gris
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Hace un momento";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `Hace ${diffInDays} dia${diffInDays > 1 ? "s" : ""}`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? "s" : ""}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `Hace ${diffInMonths} mes${diffInMonths > 1 ? "es" : ""}`;
  };

  const formatAbsoluteTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserInitials = (userName: string): string => {
    const words = userName.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-[200px]"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Cargando historial...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-3">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        className="text-center text-muted-foreground p-12 bg-muted/50 rounded-xl"
      >
        <Clock size={48} className="mb-3 mx-auto opacity-30" />
        <p className="mb-0">No hay movimientos registrados para esta orden</p>
      </div>
    );
  }

  return (
    <Card className="shadow-sm bg-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock size={20} className="text-primary" />
          Historial de Movimientos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="activity-stream">
          {logs.map((log, index) => {
            const eventColor = getEventColor(log.eventType);
            const isLastItem = index === logs.length - 1;

            return (
              <div
                key={log._id}
                className="flex gap-3 relative"
                style={{
                  paddingBottom: isLastItem ? "0" : "24px",
                }}
              >
                {/* Linea vertical conectora */}
                {!isLastItem && (
                  <div
                    className="absolute"
                    style={{
                      left: "19px",
                      top: "40px",
                      bottom: "0",
                      width: "2px",
                      background: "#E1E8ED",
                    }}
                  />
                )}

                {/* Icono del evento */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: `${eventColor}15`,
                    color: eventColor,
                    border: `2px solid ${eventColor}`,
                    zIndex: 1,
                  }}
                >
                  {getEventIcon(log.eventType)}
                </div>

                {/* Contenido del evento */}
                <div className="flex-grow">
                  <Card className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-grow">
                          <p className="mb-1 font-semibold text-sm">
                            {log.description}
                          </p>
                          <div className="flex items-center gap-2">
                            {/* Avatar/Inicial del usuario */}
                            <div
                              className="flex items-center justify-center"
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: eventColor,
                                color: "white",
                                fontSize: "10px",
                                fontWeight: "600",
                              }}
                            >
                              {getUserInitials(log.userName)}
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {log.userName}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {log.userRole}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <small
                            className="text-muted-foreground text-[11px]"
                            title={formatAbsoluteTime(log.timestamp)}
                          >
                            {formatRelativeTime(log.timestamp)}
                          </small>
                        </div>
                      </div>

                      {/* Metadata adicional si existe */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div
                          className="mt-2 pt-2 border-t"
                        >
                          <small className="text-muted-foreground">
                            {/* Mostrar informacion especifica segun el tipo de evento */}
                            {log.eventType === "payment_received" && log.metadata.amount && (
                              <div>
                                <strong>Monto:</strong>{" "}
                                {new Intl.NumberFormat("es-MX", {
                                  style: "currency",
                                  currency: "MXN",
                                }).format(log.metadata.amount)}
                                {log.metadata.remainingBalance !== undefined && (
                                  <>
                                    {" - "}
                                    <strong>Saldo pendiente:</strong>{" "}
                                    {new Intl.NumberFormat("es-MX", {
                                      style: "currency",
                                      currency: "MXN",
                                    }).format(log.metadata.remainingBalance)}
                                  </>
                                )}
                              </div>
                            )}
                            {log.eventType === "stage_changed" &&
                              log.metadata.newStageName && (
                                <div>
                                  <strong>Nueva etapa:</strong> {log.metadata.newStageName}
                                  {log.metadata.newBoardType && (
                                    <> ({log.metadata.newBoardType})</>
                                  )}
                                </div>
                              )}
                            {(log.eventType === "discount_requested" ||
                              log.eventType === "discount_approved" ||
                              log.eventType === "discount_rejected") &&
                              log.metadata.discountValue && (
                                <div>
                                  <strong>Descuento:</strong>{" "}
                                  {log.metadata.discountType === "porcentaje"
                                    ? `${log.metadata.discountValue}%`
                                    : new Intl.NumberFormat("es-MX", {
                                        style: "currency",
                                        currency: "MXN",
                                      }).format(log.metadata.discountValue)}
                                  {log.metadata.authFolio && (
                                    <>
                                      {" - "}
                                      <strong>Folio:</strong> {log.metadata.authFolio}
                                    </>
                                  )}
                                </div>
                              )}
                          </small>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityStream;
