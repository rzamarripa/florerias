"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { generateCashRegisterTicket } from "@/features/admin/modules/cash-registers/utils/generateCashRegisterTicket";
import { cashRegisterLogsService } from "./services/cashRegisterLogs";
import { CashRegisterLog } from "./types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  Printer,
  Loader2,
  DollarSign,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const CashRegisterLogSummaryPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const logId = params?.id as string;

  const [log, setLog] = useState<CashRegisterLog | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination states for different sections
  const [regularSalesPage, setRegularSalesPage] = useState(1);
  const [creditSalesPage, setCreditSalesPage] = useState(1);
  const [discountAuthsPage, setDiscountAuthsPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [buysPage, setBuysPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (logId) {
      loadLogData();
    }
  }, [logId]);

  const loadLogData = async () => {
    try {
      setLoading(true);
      const response = await cashRegisterLogsService.getCashRegisterLogById(logId);
      if (response.success) {
        setLog(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el log de caja");
      console.error("Error loading log:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!log) return;

    const summaryData = {
      cashRegisterName: log.cashRegisterName,
      branchId: log.branchId,
      cashierId: log.cashierId,
      managerId: log.managerId,
      openedAt: log.openedAt,
      closedAt: log.closedAt,
      totals: log.totals,
      salesByPaymentType: log.salesByPaymentType,
      orders: log.orders,
      expenses: log.expenses,
      buys: log.buys,
      discountAuths: log.discountAuths,
    };

    const ticketHtml = generateCashRegisterTicket(summaryData);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

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

  // Filter orders by payment type
  const getRegularOrders = () => {
    if (!log) return [];
    return log.orders.filter(order => {
      const paymentLower = order.paymentMethod?.toLowerCase() || "";
      const isStoreCredit = paymentLower === 'crédito' || paymentLower === 'credito' || 
                           (paymentLower.includes('crédito') && !paymentLower.includes('tarjeta'));
      return !isStoreCredit;
    });
  };

  const getCreditOrders = () => {
    if (!log) return [];
    return log.orders.filter(order => {
      const paymentLower = order.paymentMethod?.toLowerCase() || "";
      const isStoreCredit = paymentLower === 'crédito' || paymentLower === 'credito' || 
                           (paymentLower.includes('crédito') && !paymentLower.includes('tarjeta'));
      return isStoreCredit;
    });
  };

  // Pagination helpers
  const getPaginatedData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const renderPaginationControls = (
    currentPage: number,
    setPage: (page: number) => void,
    data: any[]
  ) => {
    const totalPages = getTotalPages(data);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center gap-1 mt-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {[...Array(totalPages)].map((_, index) => {
          const pageNumber = index + 1;
          if (
            pageNumber === 1 ||
            pageNumber === totalPages ||
            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
          ) {
            return (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="sm"
                className="h-8 min-w-[32px] px-2"
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          } else if (
            pageNumber === currentPage - 2 ||
            pageNumber === currentPage + 2
          ) {
            return (
              <span key={pageNumber} className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }
          return null;
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Cargando resumen de caja...</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="container mx-auto py-1">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Log no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                No se pudo cargar el resumen de caja solicitado.
              </p>
              <Button onClick={() => router.push("/panel-de-control/cajas/historial")}>
                Volver al historial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const regularOrders = getRegularOrders();
  const creditOrders = getCreditOrders();

  return (
    <div className="container mx-auto py-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/panel-de-control/cajas/historial")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Resumen de Cierre de Caja</h2>
            <p className="text-muted-foreground">
              {log.cashRegisterName} - {formatDate(log.closedAt)}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir Ticket
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1 mb-2">
        <Card>
          <CardHeader className="px-1.5 py-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Saldo Inicial
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-1.5 pb-1">
            <div className="text-base font-bold">
              {formatCurrency(log.totals.initialBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-1.5 py-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Ventas
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-1.5 pb-1">
            <div className="text-base font-bold text-green-600">
              {formatCurrency(log.totals.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-1.5 py-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Gastos
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-1.5 pb-1">
            <div className="text-base font-bold text-red-600">
              {formatCurrency(log.totals.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-1.5 py-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Saldo Final
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-1.5 pb-1">
            <div className="text-base font-bold text-primary">
              {formatCurrency(log.totals.finalBalance)}
            </div>
            {log.totals.remainingBalance > 0 && (
              <span className="text-xs text-muted-foreground"> • Restante: {formatCurrency(log.totals.remainingBalance)}</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Payment Type */}
      <Card className="mb-2">
        <CardHeader className="px-2 py-1">
          <CardTitle className="text-sm font-medium">Ventas por Tipo de Pago</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-1.5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Efectivo</p>
              <p className="text-base font-bold">
                {formatCurrency(log.salesByPaymentType.efectivo)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Crédito</p>
              <p className="text-base font-bold">
                {formatCurrency(log.salesByPaymentType.credito)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Transferencia</p>
              <p className="text-base font-bold">
                {formatCurrency(log.salesByPaymentType.transferencia)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Intercambio</p>
              <p className="text-base font-bold">
                {formatCurrency(log.salesByPaymentType.intercambio)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Section with Tabs */}
      <Card className="mb-2">
        <CardHeader className="px-2 py-1">
          <CardTitle className="text-sm font-medium">Ventas y Descuentos</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <Tabs defaultValue="regular" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-7">
              <TabsTrigger value="regular" className="text-xs py-1">
                Ventas Regulares ({regularOrders.length})
              </TabsTrigger>
              <TabsTrigger value="credit" className="text-xs py-1">
                Ventas a Crédito ({creditOrders.length})
              </TabsTrigger>
              <TabsTrigger value="discounts" className="text-xs py-1">
                Autorizaciones de Descuento ({log.discountAuths?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="regular" className="mt-1">
              {regularOrders.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-1 text-xs">Orden</TableHead>
                        <TableHead className="py-1 text-xs">Cliente</TableHead>
                        <TableHead className="py-1 text-xs">Destinatario</TableHead>
                        <TableHead className="py-1 text-xs">Método de Pago</TableHead>
                        <TableHead className="text-right py-1 text-xs">Total</TableHead>
                        <TableHead className="text-right py-1 text-xs">Anticipo</TableHead>
                        <TableHead className="text-right py-1 text-xs">Descuento</TableHead>
                        <TableHead className="py-1 text-xs">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginatedData(regularOrders, regularSalesPage).map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-medium py-1 text-sm">{order.orderNumber}</TableCell>
                          <TableCell className="py-1 text-sm">{order.clientName || "N/A"}</TableCell>
                          <TableCell className="py-1 text-sm">{order.recipientName || "N/A"}</TableCell>
                          <TableCell className="py-1 text-sm">
                            <Badge variant="secondary" className="text-xs">
                              {order.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            {formatCurrency(order.advance)}
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            {order.discount > 0 ? (
                              <span className="text-red-600 text-sm">
                                -{formatCurrency(order.discount)}
                                {order.discountType && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    {order.discountType}
                                  </Badge>
                                )}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="py-1 text-sm">
                            <Badge variant={order.status === "entregado" ? "success" : "default"} className="text-xs">
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPaginationControls(regularSalesPage, setRegularSalesPage, regularOrders)}
                </>
              ) : (
                <div className="text-center py-1 text-muted-foreground text-xs">
                  No hay ventas regulares registradas
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="credit" className="mt-1">
              {creditOrders.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-1 text-xs">Orden</TableHead>
                        <TableHead className="py-1 text-xs">Cliente</TableHead>
                        <TableHead className="py-1 text-xs">Destinatario</TableHead>
                        <TableHead className="py-1 text-xs">Método de Pago</TableHead>
                        <TableHead className="text-right py-1 text-xs">Total</TableHead>
                        <TableHead className="text-right py-1 text-xs">Anticipo</TableHead>
                        <TableHead className="text-right py-1 text-xs">Descuento</TableHead>
                        <TableHead className="py-1 text-xs">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginatedData(creditOrders, creditSalesPage).map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-medium py-1 text-sm">{order.orderNumber}</TableCell>
                          <TableCell className="py-1 text-sm">{order.clientName || "N/A"}</TableCell>
                          <TableCell className="py-1 text-sm">{order.recipientName || "N/A"}</TableCell>
                          <TableCell className="py-1 text-sm">
                            <Badge variant="secondary" className="text-xs">
                              {order.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            {formatCurrency(order.advance)}
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            {order.discount > 0 ? (
                              <span className="text-red-600 text-sm">
                                -{formatCurrency(order.discount)}
                                {order.discountType && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    {order.discountType}
                                  </Badge>
                                )}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="py-1 text-sm">
                            <Badge variant={order.status === "entregado" ? "success" : "default"} className="text-xs">
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPaginationControls(creditSalesPage, setCreditSalesPage, creditOrders)}
                </>
              ) : (
                <div className="text-center py-1 text-muted-foreground text-xs">
                  No hay ventas a crédito registradas
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="discounts" className="mt-1">
              {log.discountAuths && log.discountAuths.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-1 text-xs">Orden</TableHead>
                        <TableHead className="py-1 text-xs">Mensaje</TableHead>
                        <TableHead className="py-1 text-xs">Solicitado por</TableHead>
                        <TableHead className="py-1 text-xs">Gerente</TableHead>
                        <TableHead className="text-right py-1 text-xs">Descuento</TableHead>
                        <TableHead className="py-1 text-xs">Estado</TableHead>
                        <TableHead className="py-1 text-xs">Folio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginatedData(log.discountAuths, discountAuthsPage).map((auth) => (
                        <TableRow key={auth.authId}>
                          <TableCell className="font-medium py-1 text-sm">{auth.orderNumber}</TableCell>
                          <TableCell className="py-1 text-xs">{auth.message}</TableCell>
                          <TableCell className="py-1 text-xs">{auth.requestedBy}</TableCell>
                          <TableCell className="py-1 text-xs">{auth.managerId}</TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            <span className="text-sm">
                              {auth.discountType === 'porcentaje' 
                                ? `${auth.discountValue}%`
                                : formatCurrency(auth.discountValue)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              Total: {formatCurrency(auth.discountAmount)}
                            </div>
                          </TableCell>
                          <TableCell className="py-1 text-sm">
                            <Badge variant={auth.isAuth ? "success" : auth.isAuth === false ? "destructive" : "secondary"} className="text-xs">
                              {auth.isAuth ? "Autorizado" : auth.isAuth === false ? "Rechazado" : "Pendiente"}
                            </Badge>
                            {auth.isRedeemed && (
                              <Badge variant="outline" className="ml-1 text-xs">Canjeado</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1 text-xs">{auth.authFolio || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPaginationControls(discountAuthsPage, setDiscountAuthsPage, log.discountAuths)}
                </>
              ) : (
                <div className="text-center py-1 text-muted-foreground text-xs">
                  No hay autorizaciones de descuento registradas
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Expenses and Purchases Section with Tabs */}
      {((log.expenses && log.expenses.length > 0) || (log.buys && log.buys.length > 0)) && (
        <Card className="mb-2">
          <CardHeader className="px-2 py-1">
            <CardTitle className="text-sm font-medium">Gastos y Compras</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-7">
                <TabsTrigger value="expenses" className="text-xs py-1">
                  Gastos ({log.expenses?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="purchases" className="text-xs py-1">
                  Compras en Efectivo ({log.buys?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="expenses" className="mt-1">
                {log.expenses && log.expenses.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-1 text-xs">Concepto</TableHead>
                          <TableHead className="text-right py-1 text-xs">Monto</TableHead>
                          <TableHead className="py-1 text-xs">Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedData(log.expenses, expensesPage).map((expense, index) => (
                          <TableRow key={index}>
                            <TableCell className="py-1 text-sm">{expense.expenseConcept}</TableCell>
                            <TableCell className="text-right text-red-600 py-1 text-sm">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                            <TableCell className="py-1 text-xs">{formatDate(expense.expenseDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {renderPaginationControls(expensesPage, setExpensesPage, log.expenses)}
                  </>
                ) : (
                  <div className="text-center py-1 text-muted-foreground text-xs">
                    No hay gastos registrados
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="purchases" className="mt-1">
                {log.buys && log.buys.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-1 text-xs">Folio</TableHead>
                          <TableHead className="py-1 text-xs">Concepto</TableHead>
                          <TableHead className="py-1 text-xs">Descripción</TableHead>
                          <TableHead className="py-1 text-xs">Proveedor</TableHead>
                          <TableHead className="py-1 text-xs">Usuario</TableHead>
                          <TableHead className="text-right py-1 text-xs">Monto</TableHead>
                          <TableHead className="py-1 text-xs">Método de Pago</TableHead>
                          <TableHead className="py-1 text-xs">Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedData(log.buys, buysPage).map((buy, index) => (
                          <TableRow key={buy.buyId || index}>
                            <TableCell className="font-medium py-1 text-xs">{buy.folio}</TableCell>
                            <TableCell className="py-1 text-xs">{buy.concept}</TableCell>
                            <TableCell className="py-1 text-xs">{buy.conceptDescription}</TableCell>
                            <TableCell className="py-1 text-xs">{buy.provider}</TableCell>
                            <TableCell className="py-1 text-xs">{buy.user}</TableCell>
                            <TableCell className="text-right text-red-600 py-1 text-sm">
                              {formatCurrency(buy.amount)}
                            </TableCell>
                            <TableCell className="py-1 text-sm">
                              <Badge variant="secondary" className="text-xs">{buy.paymentMethod}</Badge>
                            </TableCell>
                            <TableCell className="py-1 text-xs">{formatDate(buy.paymentDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {renderPaginationControls(buysPage, setBuysPage, log.buys)}
                  </>
                ) : (
                  <div className="text-center py-1 text-muted-foreground text-xs">
                    No hay compras registradas
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Staff Information */}
      <Card>
        <CardHeader className="px-2 py-1">
          <CardTitle className="text-sm font-medium">Información del Personal</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <h4 className="font-semibold mb-1 text-sm">Cajero</h4>
              {log.cashierId ? (
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Nombre:</span>{" "}
                    {log.cashierId.profile.fullName}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Usuario:</span>{" "}
                    {log.cashierId.username}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {log.cashierId.email}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No asignado</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-sm">Gerente</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Nombre:</span>{" "}
                  {log.managerId.profile.fullName}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Usuario:</span>{" "}
                  {log.managerId.username}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {log.managerId.email}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashRegisterLogSummaryPage;