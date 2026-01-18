"use client";

import React from "react";
import {
  DollarSign,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Repeat,
  Loader2,
} from "lucide-react";
import { CashRegisterLog } from "../types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CashCountDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: CashRegisterLog | null;
  loading: boolean;
}

const CashCountDetailModal: React.FC<CashCountDetailModalProps> = ({
  open,
  onOpenChange,
  log,
  loading,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || !log) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-3">Cargando detalle...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            Detalle de Cierre de Caja
          </DialogTitle>
          <DialogDescription>
            {log.cashRegisterName} - {log.branchId.branchName}
            <br />
            <span className="text-xs">
              Cerrado el: {formatDate(log.closedAt)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <div className="space-y-4 pb-4">
            {/* Totales Section */}
            <Card className="shadow-sm rounded-xl">
              <CardContent className="p-3">
                <h6 className="font-bold mb-3 text-sm">
                  Esta caja contaba con:
                </h6>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-right">
                    <div className="text-muted-foreground mb-1 text-xs">
                      Saldo Inicial
                    </div>
                    <div className="font-bold text-base">
                      {formatCurrency(log.totals.initialBalance)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-muted-foreground mb-1 text-xs">
                      ( + ) Ventas
                    </div>
                    <div className="font-bold text-base text-green-600">
                      {formatCurrency(log.totals.totalSales)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-muted-foreground mb-1 text-xs">
                      ( - ) Gastos
                    </div>
                    <div className="font-bold text-base text-red-600">
                      {formatCurrency(log.totals.totalExpenses)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-muted-foreground mb-1 text-xs">
                      ( = ) Saldo Total
                    </div>
                    <div className="font-bold text-lg text-primary">
                      {formatCurrency(log.totals.finalBalance)}
                    </div>
                  </div>
                </div>

                <hr className="my-2 opacity-10" />

                <p className="font-bold text-sm">
                  Total Efectivo: {formatCurrency(log.salesByPaymentType.efectivo)}
                </p>
              </CardContent>
            </Card>

            {/* Income Cards Section - Ingresos */}
            <h6 className="font-bold text-sm">Ingresos</h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Card Efectivo */}
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-muted-foreground font-normal text-xs">
                      Efectivo
                    </h6>
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl"
                      style={{ background: "rgba(26, 188, 156, 0.1)" }}
                    >
                      <DollarSign size={18} className="text-[#1ABC9C]" />
                    </div>
                  </div>
                  <h5 className="font-bold text-xl">
                    {formatCurrency(log.salesByPaymentType.efectivo)}
                  </h5>
                </CardContent>
              </Card>

              {/* Card Intercambio */}
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-muted-foreground font-normal text-xs">
                      Intercambio
                    </h6>
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl"
                      style={{ background: "rgba(243, 156, 18, 0.1)" }}
                    >
                      <Repeat size={18} className="text-[#F39C12]" />
                    </div>
                  </div>
                  <h5 className="font-bold text-xl">
                    {formatCurrency(log.salesByPaymentType.intercambio)}
                  </h5>
                </CardContent>
              </Card>

              {/* Card Credito */}
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-muted-foreground font-normal text-xs">
                      Credito
                    </h6>
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl"
                      style={{ background: "rgba(52, 152, 219, 0.1)" }}
                    >
                      <CreditCard size={18} className="text-[#3498DB]" />
                    </div>
                  </div>
                  <h5 className="font-bold text-xl">
                    {formatCurrency(log.salesByPaymentType.credito)}
                  </h5>
                </CardContent>
              </Card>

              {/* Card Transferencia */}
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-muted-foreground font-normal text-xs">
                      Transferencia
                    </h6>
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl"
                      style={{ background: "rgba(155, 89, 182, 0.1)" }}
                    >
                      <ArrowLeftRight size={18} className="text-[#9B59B6]" />
                    </div>
                  </div>
                  <h5 className="font-bold text-xl">
                    {formatCurrency(log.salesByPaymentType.transferencia)}
                  </h5>
                </CardContent>
              </Card>
            </div>

            {/* Sales Table Section */}
            <Card className="shadow-sm rounded-xl">
              <CardContent className="p-0">
                <div className="p-3 border-b">
                  <h6 className="font-bold text-sm">Detalle de Ventas</h6>
                </div>

                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        No.
                      </TableHead>
                      <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        FECHA
                      </TableHead>
                      <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        FORMA PAGO
                      </TableHead>
                      <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        CLIENTE
                      </TableHead>
                      <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        VENTA
                      </TableHead>
                      <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                        IMPORTE
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <Wallet size={36} className="mb-2 opacity-50 mx-auto" />
                          <p className="text-xs">No se encontraron ventas</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      log.orders.map((order, index) => (
                        <TableRow
                          key={order._id || index}
                          className="border-b border-border/50 text-[13px]"
                        >
                          <TableCell className="px-3 py-2">{index + 1}</TableCell>
                          <TableCell className="px-3 py-2">
                            <small>{formatDate(order.saleDate)}</small>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <Badge
                              className={`px-2 py-0.5 rounded-xl font-medium text-[0.7rem] ${
                                order.paymentMethod
                                  .toLowerCase()
                                  .includes("efectivo")
                                  ? "bg-green-100 text-green-800"
                                  : order.paymentMethod
                                        .toLowerCase()
                                        .includes("credito") ||
                                      order.paymentMethod
                                        .toLowerCase()
                                        .includes("tarjeta")
                                    ? "bg-blue-100 text-blue-800"
                                    : order.paymentMethod
                                          .toLowerCase()
                                          .includes("transferencia")
                                      ? "bg-cyan-100 text-cyan-800"
                                      : order.paymentMethod
                                            .toLowerCase()
                                            .includes("intercambio")
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <div className="font-semibold text-xs">
                              {order.clientName}
                            </div>
                            <small className="text-muted-foreground text-[10px]">
                              Para: {order.recipientName}
                            </small>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <div className="text-xs">{order.orderNumber}</div>
                            <small className="text-muted-foreground text-[10px]">
                              {order.itemsCount}{" "}
                              {order.itemsCount === 1 ? "producto" : "productos"}
                            </small>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <span className="font-bold text-[13px]">
                              {formatCurrency(order.advance)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Expenses Table Section */}
            {log.expenses && log.expenses.length > 0 && (
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-0">
                  <div className="p-3 border-b">
                    <h6 className="font-bold text-sm">Detalle de Gastos</h6>
                  </div>

                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          No.
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          FECHA
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          CONCEPTO
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs text-right">
                          IMPORTE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {log.expenses.map((expense, index) => (
                        <TableRow
                          key={expense._id || index}
                          className="border-b border-border/50 text-[13px]"
                        >
                          <TableCell className="px-3 py-2">{index + 1}</TableCell>
                          <TableCell className="px-3 py-2">
                            <small>{formatDate(expense.expenseDate)}</small>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <div className="font-semibold text-xs">
                              {expense.expenseConcept}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <span className="font-bold text-red-600 text-[13px]">
                              {formatCurrency(expense.amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Buys Table Section */}
            {log.buys && log.buys.length > 0 && (
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-0">
                  <div className="p-3 border-b">
                    <h6 className="font-bold text-sm">
                      Detalle de Compras en Efectivo
                    </h6>
                  </div>

                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          FOLIO
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          FECHA
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          CONCEPTO
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          PROVEEDOR
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                          USUARIO
                        </TableHead>
                        <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-xs text-right">
                          IMPORTE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {log.buys.map((buy, index) => (
                        <TableRow
                          key={buy._id || index}
                          className="border-b border-border/50 text-[13px]"
                        >
                          <TableCell className="px-3 py-2">
                            <span className="font-semibold">{buy.folio}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <small>{formatDate(buy.paymentDate)}</small>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <div className="font-semibold text-xs">
                              {buy.concept}
                            </div>
                            {buy.description && (
                              <small className="text-muted-foreground text-[10px]">
                                {buy.description}
                              </small>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <small>{buy.provider}</small>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <small>{buy.user}</small>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <span className="font-bold text-[13px] text-amber-700">
                              {formatCurrency(buy.amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashCountDetailModal;
