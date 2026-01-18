"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Package,
  DollarSign,
  CreditCard,
  TrendingDown,
  Truck,
  Receipt,
  Building,
  Clock,
  FileText,
  XCircle,
  Loader2,
} from "lucide-react";
import { Sale } from "../types";
import ActivityStream from "./ActivityStream";
import { orderPaymentsService, OrderPayment } from "../services/orderPayments";

interface SaleDetailModalProps {
  show: boolean;
  onHide: () => void;
  sale: Sale | null;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  show,
  onHide,
  sale,
}) => {
  const [showActivity, setShowActivity] = useState(false);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (show && sale) {
      loadPayments();
    }
  }, [show, sale]);

  const loadPayments = async () => {
    if (!sale) return;
    try {
      setLoadingPayments(true);
      const paymentsData = await orderPaymentsService.getOrderPayments(sale._id);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  if (!sale) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; text: string }> = {
      pendiente: { variant: "secondary", text: "Pendiente" },
      "en-proceso": { variant: "default", text: "En Proceso" },
      completado: { variant: "default", text: "Completado" },
      cancelado: { variant: "destructive", text: "Cancelado" },
    };

    const statusInfo = statusMap[status] || { variant: "secondary" as const, text: status };

    return (
      <Badge variant={statusInfo.variant} className="px-4 py-1.5 rounded-full font-semibold text-sm">
        {statusInfo.text}
      </Badge>
    );
  };

  const discountAmount =
    sale.discountType === "porcentaje"
      ? (sale.subtotal * (sale.discount || 0)) / 100
      : sale.discount || 0;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-50">
        <DialogHeader className="pb-0">
          <DialogTitle className="w-full">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="mb-1 font-bold text-xl">
                  Detalle de Venta #{sale.orderNumber || sale._id.slice(-8)}
                </h4>
                <p className="text-muted-foreground mb-0 text-sm font-normal">
                  {formatDate(sale.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showActivity ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowActivity(!showActivity)}
                  className="flex items-center gap-2 rounded-lg font-semibold"
                >
                  {showActivity ? <FileText className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {showActivity ? "Ver Detalle" : "Ver Historial"}
                </Button>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {showActivity ? (
            /* Mostrar Activity Stream */
            <ActivityStream orderId={sale._id} />
          ) : (
            <>
              {/* Banner de Cancelacion */}
              {sale.status === "cancelado" && (
                <div
                  className="flex items-start mb-4 p-4 rounded-xl bg-red-50 text-red-800"
                  role="alert"
                >
                  <div
                    className="flex items-center justify-center mr-3 flex-shrink-0 w-12 h-12 rounded-xl bg-red-100"
                  >
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-grow">
                    <h6 className="font-bold mb-1 text-red-700">
                      Orden Cancelada
                    </h6>
                    <p className="mb-1 font-semibold text-red-700">
                      Motivo: {sale.cancellationReason || "No especificado"}
                    </p>
                    {sale.cancelledAt && (
                      <small className="text-muted-foreground">
                        Cancelada el {formatDate(sale.cancelledAt)}
                        {sale.cancelledBy &&
                          typeof sale.cancelledBy === "object" &&
                          ` por ${sale.cancelledBy.name}`}
                      </small>
                    )}
                  </div>
                </div>
              )}

              {/* Resumen Financiero - Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {/* Card Subtotal */}
                <Card className="shadow-sm rounded-xl">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-muted-foreground mb-0 font-normal text-xs">
                        Subtotal
                      </h6>
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-lg"
                        style={{ background: "rgba(52, 152, 219, 0.1)" }}
                      >
                        <Receipt className="h-5 w-5" style={{ color: "#3498DB" }} />
                      </div>
                    </div>
                    <h3 className="mb-0 font-bold text-2xl">
                      {formatCurrency(sale.subtotal || 0)}
                    </h3>
                  </CardContent>
                </Card>

                {/* Card Descuento */}
                <Card className="shadow-sm rounded-xl">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-muted-foreground mb-0 font-normal text-xs">
                        Descuento
                      </h6>
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-lg"
                        style={{ background: "rgba(231, 76, 60, 0.1)" }}
                      >
                        <TrendingDown className="h-5 w-5" style={{ color: "#E74C3C" }} />
                      </div>
                    </div>
                    <h3 className="mb-0 font-bold text-2xl text-red-500">
                      -{formatCurrency(discountAmount)}
                    </h3>
                    {sale.discount > 0 && (
                      <small className="text-muted-foreground">
                        {sale.discountType === "porcentaje"
                          ? `${sale.discount}%`
                          : "Cantidad fija"}
                      </small>
                    )}
                  </CardContent>
                </Card>

                {/* Card Total */}
                <Card className="shadow-sm rounded-xl">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-muted-foreground mb-0 font-normal text-xs">
                        Total
                      </h6>
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-lg"
                        style={{ background: "rgba(26, 188, 156, 0.1)" }}
                      >
                        <DollarSign className="h-5 w-5" style={{ color: "#1ABC9C" }} />
                      </div>
                    </div>
                    <h3 className="mb-0 font-bold text-2xl text-green-500">
                      {formatCurrency(sale.total || 0)}
                    </h3>
                  </CardContent>
                </Card>

                {/* Card Saldo Pendiente */}
                <Card className="shadow-sm rounded-xl">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-muted-foreground mb-0 font-normal text-xs">
                        Saldo Pendiente
                      </h6>
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-lg"
                        style={{ background: "rgba(243, 156, 18, 0.1)" }}
                      >
                        <CreditCard className="h-5 w-5" style={{ color: "#F39C12" }} />
                      </div>
                    </div>
                    <h3
                      className="mb-0 font-bold text-2xl"
                      style={{
                        color: sale.remainingBalance > 0 ? "#F39C12" : "#1ABC9C",
                      }}
                    >
                      {formatCurrency(sale.remainingBalance || 0)}
                    </h3>
                  </CardContent>
                </Card>
              </div>

              {/* Informacion del Cliente y Entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Cliente */}
                <Card className="shadow-sm h-full rounded-xl">
                  <CardContent className="p-4">
                    <h5 className="font-bold mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Informacion del Cliente
                    </h5>
                    <div className="mb-3">
                      <div className="flex items-start gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <small className="text-muted-foreground block">Cliente</small>
                          <span className="font-semibold">
                            {sale.clientInfo?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                      {sale.clientInfo?.phone && (
                        <div className="flex items-start gap-2 mb-2">
                          <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <small className="text-muted-foreground block">Telefono</small>
                            <span className="font-semibold">
                              {sale.clientInfo.phone}
                            </span>
                          </div>
                        </div>
                      )}
                      {sale.clientInfo?.email && (
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <small className="text-muted-foreground block">Email</small>
                            <span className="font-semibold">
                              {sale.clientInfo.email}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <small className="text-muted-foreground block">Canal</small>
                          <Badge variant="secondary" className="capitalize">
                            {sale.salesChannel || "tienda"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <small className="text-muted-foreground block">
                            Metodo de Pago
                          </small>
                          <Badge>
                            {typeof sale.paymentMethod === "string"
                              ? sale.paymentMethod
                              : sale.paymentMethod?.name || "N/A"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Entrega */}
                <Card className="shadow-sm h-full rounded-xl">
                  <CardContent className="p-4">
                    <h5 className="font-bold mb-3 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Datos de Entrega
                    </h5>
                    <div className="mb-3">
                      <div className="flex items-start gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <small className="text-muted-foreground block">
                            Recibe
                          </small>
                          <span className="font-semibold">
                            {sale.deliveryData?.recipientName || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <small className="text-muted-foreground block">
                            Fecha de Entrega
                          </small>
                          <span className="font-semibold">
                            {sale.deliveryData?.deliveryDateTime
                              ? formatDate(sale.deliveryData.deliveryDateTime)
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 mb-2">
                        <Package className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <small className="text-muted-foreground block">
                            Tipo de Envio
                          </small>
                          <Badge
                            variant={sale.shippingType === "envio" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {sale.shippingType}
                          </Badge>
                          {sale.shippingType === "envio" &&
                            sale.deliveryData?.deliveryPrice > 0 && (
                              <span className="ml-2 text-muted-foreground">
                                (
                                {formatCurrency(
                                  sale.deliveryData.deliveryPrice
                                )}
                                )
                              </span>
                            )}
                        </div>
                      </div>

                      {sale.shippingType === "envio" &&
                        sale.deliveryData?.street && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <small className="text-muted-foreground block">
                                Direccion
                              </small>
                              <span className="font-semibold">
                                {sale.deliveryData.street}
                              </span>
                              {sale.deliveryData.reference && (
                                <small className="block text-muted-foreground mt-1">
                                  {sale.deliveryData.reference}
                                </small>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {sale.deliveryData?.message && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <small className="text-muted-foreground block">Mensaje</small>
                            <p className="mb-0 italic">
                              {sale.deliveryData.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Productos */}
              <Card className="shadow-sm mb-4 rounded-xl">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="font-bold mb-0 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Productos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          CANTIDAD
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          PRODUCTO
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">TIPO</TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                          PRECIO UNIT.
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                          IMPORTE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items && sale.items.length > 0 ? (
                        sale.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="px-4 py-3 font-semibold">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="font-semibold">{item.productName}</div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge
                                variant={item.isProduct ? "default" : "secondary"}
                                className="text-white"
                              >
                                {item.isProduct ? "Catalogo" : "Manual"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right font-bold">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-5 text-muted-foreground">
                            No hay productos en esta venta
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Historial de Pagos */}
              <Card className="shadow-sm mb-4 rounded-xl">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="font-bold mb-0 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Historial de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingPayments ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                      <p className="text-muted-foreground mt-2 mb-0">Cargando pagos...</p>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="mb-0">No hay pagos adicionales registrados</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                            FECHA
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                            METODO
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                            CAJA
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                            REGISTRADO POR
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                            NOTAS
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                            MONTO
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell className="px-4 py-3">
                              {new Date(payment.date).toLocaleString("es-MX", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge>
                                {payment.paymentMethod?.name || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {payment.cashRegisterId?.name || "N/A"}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {payment.registeredBy?.username || "N/A"}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground">
                              {payment.notes || "-"}
                            </TableCell>
                            <TableCell className="px-4 py-3 font-bold text-green-500 text-right">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter className="bg-gray-50">
                        <TableRow>
                          <TableCell colSpan={5} className="px-4 py-3 font-bold text-right">
                            Total pagos adicionales:
                          </TableCell>
                          <TableCell className="px-4 py-3 font-bold text-green-500 text-right">
                            {formatCurrency(
                              payments.reduce((sum, p) => sum + p.amount, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de Pago */}
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-4">
                  <h5 className="font-bold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Resumen de Pago
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="md:col-start-2">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">
                          {formatCurrency(sale.subtotal || 0)}
                        </span>
                      </div>
                      {sale.discount > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">
                            Descuento (
                            {sale.discountType === "porcentaje"
                              ? `${sale.discount}%`
                              : "Fijo"}
                            ):
                          </span>
                          <span className="font-semibold text-red-500">
                            -{formatCurrency(discountAmount)}
                          </span>
                        </div>
                      )}
                      {sale.shippingType === "envio" &&
                        sale.deliveryData?.deliveryPrice > 0 && (
                          <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Costo de Envio:</span>
                            <span className="font-semibold text-green-500">
                              +
                              {formatCurrency(
                                sale.deliveryData.deliveryPrice
                              )}
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between mb-2 pt-2 border-t">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(sale.total || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Anticipo:</span>
                        <span className="font-semibold text-green-500">
                          {formatCurrency(
                            payments.find((p) => p.isAdvance)?.amount || 0
                          )}
                        </span>
                      </div>
                      {sale.paidWith > 0 && (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Pago con:</span>
                            <span className="font-semibold">
                              {formatCurrency(sale.paidWith)}
                            </span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Cambio:</span>
                            <span className="font-semibold">
                              {formatCurrency(sale.change || 0)}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-bold">Saldo Pendiente:</span>
                        <span
                          className="font-bold text-lg"
                          style={{
                            color: sale.remainingBalance > 0 ? "#F39C12" : "#1ABC9C",
                          }}
                        >
                          {formatCurrency(sale.remainingBalance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetailModal;
