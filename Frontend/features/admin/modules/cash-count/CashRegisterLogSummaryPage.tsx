"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { generateCashRegisterTicket } from "@/features/admin/modules/cash-registers/utils/generateCashRegisterTicket";
import { cashRegisterLogsService } from "./services/cashRegisterLogs";
import { CashRegisterSummary } from "@/features/admin/modules/cash-registers/types";
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
  Wallet,
  Package,
  X,
  ReceiptText,
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

  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination states for different sections
  const [paginationState, setPaginationState] = useState<{ [key: string]: number }>({});
  const [expensesPage, setExpensesPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [discountAuthsPage, setDiscountAuthsPage] = useState(1);
  const [salesCanceledPage, setSalesCanceledPage] = useState(1);
  const [salesDiscountsPage, setSalesDiscountsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (logId) {
      loadLogData();
    }
  }, [logId]);

  const loadLogData = async () => {
    try {
      setLoading(true);
      const response = await cashRegisterLogsService.getCashRegisterLogById(logId);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el log de caja");
      console.error("Error loading log:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!summary) return;

    try {
      // Generate unique folio number based on timestamp
      const folioNumber = `CORTE-${summary.cashRegister._id
        .slice(-6)
        .toUpperCase()}-${Date.now().toString().slice(-6)}`;

      // Get cashier name
      const closedBy = summary.cashRegister.activeUser?.profile?.fullName || "Cajero";

      // Closure date from metadata or current date
      const closureDate = summary.logMetadata?.closedAt || new Date().toISOString();

      // Generate ticket HTML
      const ticketHTML = generateCashRegisterTicket(summary, {
        closedBy,
        closureDate,
        folioNumber,
        remainingBalance: summary.totals.remainingBalance || 0,
      });

      // Create print window
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();

        // Wait for content to load before printing
        printWindow.onload = () => {
          printWindow.focus();
        };
      } else {
        toast.error(
          "No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador."
        );
      }
    } catch (error) {
      console.error("Error generando ticket:", error);
      toast.error("Error al generar el ticket de cierre");
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

  // Get payment methods from paymentsByMethod or ordersByPaymentMethod
  // NOTE: This must be before any conditional returns to follow React hooks rules
  const paymentMethods = React.useMemo(() => {
    // Prioritize paymentsByMethod if available
    if (summary?.paymentsByMethod) {
      return Object.keys(summary.paymentsByMethod).sort();
    }
    // Fallback to ordersByPaymentMethod
    if (summary?.ordersByPaymentMethod) {
      return Object.keys(summary.ordersByPaymentMethod).sort();
    }
    // Final fallback to old logic
    return ['regular', 'credit'];
  }, [summary?.paymentsByMethod, summary?.ordersByPaymentMethod]);

  // Initialize pagination state for each payment method
  React.useEffect(() => {
    if (paymentMethods.length > 0) {
      const initialState: { [key: string]: number } = {};
      paymentMethods.forEach(method => {
        if (!paginationState[method]) {
          initialState[method] = 1;
        }
      });
      if (Object.keys(initialState).length > 0) {
        setPaginationState(prev => ({ ...prev, ...initialState }));
      }
    }
  }, [paymentMethods, paginationState]);

  // Fallback for old logic (if backend doesn't support ordersByPaymentMethod yet)
  const regularOrders = React.useMemo(() => {
    if (summary?.ordersByPaymentMethod) return [];
    if (!summary?.orders) return [];
    return summary.orders.filter((order) => {
      const paymentLower = order.paymentMethod.toLowerCase();
      const isStoreCredit =
        paymentLower === "crédito" ||
        paymentLower === "credito" ||
        (paymentLower.includes("crédito") && !paymentLower.includes("tarjeta"));
      return !isStoreCredit;
    });
  }, [summary]);

  const creditOrders = React.useMemo(() => {
    if (summary?.ordersByPaymentMethod) return [];
    if (!summary?.orders) return [];
    return summary.orders.filter((order) => {
      const paymentLower = order.paymentMethod.toLowerCase();
      const isStoreCredit =
        paymentLower === "crédito" ||
        paymentLower === "credito" ||
        (paymentLower.includes("crédito") && !paymentLower.includes("tarjeta"));
      return isStoreCredit;
    });
  }, [summary]);

  // Pagination helper functions
  const getPaginatedData = <T,>(data: T[], page: number): T[] => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]): number => {
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  };

  // Helper function to get paginated payments for a specific payment method
  const getPaginatedPaymentsForMethod = (methodName: string, page: number) => {
    if (!summary?.paymentsByMethod || !summary.paymentsByMethod[methodName]) {
      return [];
    }
    const payments = summary.paymentsByMethod[methodName].payments;
    return getPaginatedData(payments, page);
  };

  // Helper function to get paginated orders for a specific payment method
  const getPaginatedOrdersForMethod = (methodName: string, page: number) => {
    if (!summary?.ordersByPaymentMethod || !summary.ordersByPaymentMethod[methodName]) {
      return [];
    }
    const orders = summary.ordersByPaymentMethod[methodName].orders;
    return getPaginatedData(orders, page);
  };

  // Helper function to get total pages for payments of a payment method
  const getTotalPagesForPaymentsMethod = (methodName: string) => {
    if (!summary?.paymentsByMethod || !summary.paymentsByMethod[methodName]) {
      return 0;
    }
    return getTotalPages(summary.paymentsByMethod[methodName].payments);
  };

  // Helper function to get total pages for orders of a payment method
  const getTotalPagesForMethod = (methodName: string) => {
    if (!summary?.ordersByPaymentMethod || !summary.ordersByPaymentMethod[methodName]) {
      return 0;
    }
    return getTotalPages(summary.ordersByPaymentMethod[methodName].orders);
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

  if (!summary) {
    return (
      <div className="py-1">
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

  return (
    <div className="py-1">
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
              {summary.cashRegister.name} - {formatDate(summary.logMetadata?.closedAt || new Date().toISOString())}
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
              {formatCurrency(summary.totals.initialBalance)}
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
              {formatCurrency(summary.totals.totalSales)}
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
              {formatCurrency(summary.totals.totalExpenses)}
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
              {formatCurrency(summary.totals.currentBalance || summary.totals.finalBalance || 0)}
            </div>
            {(summary.totals.remainingBalance ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground"> • Restante: {formatCurrency(summary.totals.remainingBalance || 0)}</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Payment Type */}
      <Card className="shadow-sm mb-4 rounded-[15px]">
        <CardHeader className="px-2 py-1">
          <CardTitle className="text-sm font-medium">Ventas por Tipo de Pago</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-1.5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Efectivo</p>
              <p className="text-base font-bold">
                {formatCurrency(summary.salesByPaymentType?.efectivo || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Crédito</p>
              <p className="text-base font-bold">
                {formatCurrency(summary.salesByPaymentType?.credito || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Transferencia</p>
              <p className="text-base font-bold">
                {formatCurrency(summary.salesByPaymentType?.transferencia || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Intercambio</p>
              <p className="text-base font-bold">
                {formatCurrency(summary.salesByPaymentType?.intercambio || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments by Payment Method Section */}
      {summary?.paymentsByMethod && Object.keys(summary.paymentsByMethod).length > 0 && (
        <Card className="shadow-sm mb-4 rounded-[15px]">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h5 className="font-bold mb-0">Pagos por Método de Pago</h5>
            </div>

            <Tabs defaultValue={paymentMethods[0] || "efectivo"} className="w-full">
              <div className="px-4 pt-3 border-b">
                <TabsList className="bg-transparent h-auto p-0 gap-0 flex-wrap">
                  {paymentMethods.map((methodName) => (
                    <TabsTrigger
                      key={methodName}
                      value={methodName}
                      className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      {methodName} ({summary.paymentsByMethod?.[methodName]?.count || 0})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Dynamic Tab Contents for Payments */}
              {paymentMethods.map((methodName) => (
                <TabsContent key={methodName} value={methodName} className="mt-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          No.
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          TIPO
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          FECHA
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          ORDEN
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          CLIENTE
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          NOTAS
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          REGISTRADO POR
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          IMPORTE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!summary.paymentsByMethod?.[methodName]?.payments || summary.paymentsByMethod[methodName].payments.length === 0) ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <Wallet size={48} className="mb-3 opacity-50 mx-auto" />
                            <p className="mb-0">
                              No se encontraron pagos con {methodName}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        getPaginatedPaymentsForMethod(methodName, paginationState[methodName] || 1).map((payment, index) => (
                          <TableRow key={payment._id}>
                            <TableCell className="px-4 py-3">
                              {((paginationState[methodName] || 1) - 1) * ITEMS_PER_PAGE + index + 1}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {payment.isAdvance ? (
                                <Badge className="bg-blue-500 text-white hover:bg-blue-500 px-2 py-0.5 text-xs font-semibold">
                                  ANTICIPO
                                </Badge>
                              ) : (
                                <Badge className="bg-green-500 text-white hover:bg-green-500 px-2 py-0.5 text-xs font-semibold">
                                  PAGO
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <small>{formatDate(payment.date)}</small>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="font-semibold">
                                {payment.orderNumber}
                              </div>
                              {payment.orderStatus === "cancelado" && (
                                <Badge className="bg-red-500 text-white hover:bg-red-500 px-2 py-0.5 text-xs font-semibold mt-1">
                                  CANCELADA
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="font-semibold">
                                {payment.clientName}
                              </div>
                              <small className="text-muted-foreground">
                                Para: {payment.recipientName}
                              </small>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <small className="text-muted-foreground">
                                {payment.notes || "-"}
                              </small>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <small className="text-muted-foreground">
                                {payment.registeredBy}
                              </small>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span
                                className={`font-bold ${
                                  payment.orderStatus === "cancelado"
                                    ? "line-through text-red-500"
                                    : ""
                                }`}
                              >
                                {formatCurrency(payment.amount)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination controls */}
                  {summary.paymentsByMethod?.[methodName]?.payments && summary.paymentsByMethod[methodName].payments.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {getPaginatedPaymentsForMethod(methodName, paginationState[methodName] || 1).length} de {summary.paymentsByMethod[methodName].payments.length} pagos
                      </div>
                      {getTotalPagesForPaymentsMethod(methodName) > 1 && renderPaginationControls(
                        paginationState[methodName] || 1,
                        (page) => setPaginationState(prev => ({ ...prev, [methodName]: page })),
                        summary.paymentsByMethod[methodName].payments
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Sales Section with Tabs */}
      <Card className="shadow-sm mb-4 rounded-[15px]">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h5 className="font-bold mb-0">Detalle de Ventas</h5>
          </div>

          <Tabs defaultValue="regular" className="w-full">
            <div className="px-4 pt-3 border-b">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                <TabsTrigger
                  value="regular"
                  className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Ventas Regulares ({regularOrders.length})
                </TabsTrigger>
                <TabsTrigger
                  value="credit"
                  className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Ventas a Crédito ({creditOrders.length})
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="regular" className="mt-0">
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
                      {getPaginatedData(regularOrders, paginationState['regular'] || 1).map((order) => (
                        <TableRow key={order._id}>
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
                            <Badge variant="default" className="text-xs">
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPaginationControls(paginationState['regular'] || 1, (page) => setPaginationState(prev => ({ ...prev, regular: page })), regularOrders)}
                </>
              ) : (
                <div className="text-center py-1 text-muted-foreground text-xs">
                  No hay ventas regulares registradas
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="credit" className="mt-0">
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
                      {getPaginatedData(creditOrders, paginationState['credit'] || 1).map((order) => (
                        <TableRow key={order._id}>
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
                            <Badge variant="default" className="text-xs">
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPaginationControls(paginationState['credit'] || 1, (page) => setPaginationState(prev => ({ ...prev, credit: page })), creditOrders)}
                </>
              ) : (
                <div className="text-center py-1 text-muted-foreground text-xs">
                  No hay ventas a crédito registradas
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sales Special Section with Tabs - Canceled Orders and Authorized Discounts */}
      {((summary?.canceledOrders && summary.canceledOrders.length > 0) || (summary?.authorizedDiscounts && summary.authorizedDiscounts.length > 0)) && (
        <Card className="shadow-sm mb-4 rounded-[15px]">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h5 className="font-bold mb-0">Detalle de Ventas Especiales</h5>
            </div>

            <Tabs defaultValue="canceled" className="w-full">
              <div className="px-4 pt-3 border-b">
                <TabsList className="bg-transparent h-auto p-0 gap-0">
                  <TabsTrigger
                    value="canceled"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <X size={16} className="mr-2" />
                    Ventas Canceladas ({summary?.canceledOrders?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="discounts"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <ReceiptText size={16} className="mr-2" />
                    Descuentos Autorizados ({summary?.authorizedDiscounts?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Canceled Orders Tab */}
              <TabsContent value="canceled" className="mt-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        No.
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        FECHA
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        NO. ORDEN
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        CLIENTE
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        DESTINATARIO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        MÉTODO PAGO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        TOTAL
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        ESTADO
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!summary?.canceledOrders || summary.canceledOrders.length === 0) ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <X size={48} className="mb-3 opacity-50 mx-auto" />
                          <p className="mb-0">
                            No hay ventas canceladas en esta sesión
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedData(summary.canceledOrders, salesCanceledPage).map((order, index) => (
                        <TableRow key={order._id}>
                          <TableCell className="px-4 py-3">
                            {(salesCanceledPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <small>{formatDate(order.createdAt)}</small>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="font-semibold">
                              {order.orderNumber}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="font-semibold">
                              {order.clientName}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {order.recipientName}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {order.paymentMethod.split(", ").map((method, idx) => (
                              <Badge
                                key={idx}
                                className={`mr-1 mb-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  method.toLowerCase().includes("efectivo")
                                    ? "bg-green-500 text-white hover:bg-green-500"
                                    : method.toLowerCase().includes("tarjeta")
                                    ? "bg-cyan-500 text-white hover:bg-cyan-500"
                                    : method.toLowerCase().includes("transferencia")
                                    ? "bg-primary text-primary-foreground hover:bg-primary"
                                    : "bg-gray-500 text-white hover:bg-gray-500"
                                }`}
                              >
                                {method}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="font-bold line-through text-red-500">
                              {formatCurrency(order.total)}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className="bg-red-500 text-white hover:bg-red-500 px-2 py-0.5 text-xs font-semibold">
                              CANCELADA
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination controls for Canceled Orders */}
                {summary?.canceledOrders && summary.canceledOrders.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {getPaginatedData(summary.canceledOrders, salesCanceledPage).length} de {summary.canceledOrders.length} registros
                    </div>
                    {renderPaginationControls(salesCanceledPage, setSalesCanceledPage, summary.canceledOrders)}
                  </div>
                )}
              </TabsContent>

              {/* Authorized Discounts Tab */}
              <TabsContent value="discounts" className="mt-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        No.
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        ORDEN
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        MENSAJE
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        SOLICITADO POR
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        GERENTE
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        DESCUENTO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        ESTADO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        FOLIO
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!summary?.authorizedDiscounts || summary.authorizedDiscounts.length === 0) ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <ReceiptText size={48} className="mb-3 opacity-50 mx-auto" />
                          <p className="mb-0">
                            No hay descuentos autorizados en esta sesión
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedData(summary.authorizedDiscounts, salesDiscountsPage).map((auth, index) => (
                        <TableRow key={auth._id}>
                          <TableCell className="px-4 py-3">
                            {(salesDiscountsPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="font-semibold">
                              {auth.orderNumber}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <small className="text-muted-foreground">
                              {auth.message}
                            </small>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {auth.requestedBy}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {auth.managerId}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div>
                              <span className="font-semibold">
                                {auth.discountType === 'porcentaje' 
                                  ? `${auth.discountValue}%`
                                  : formatCurrency(auth.discountValue)}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                Total: {formatCurrency(auth.discountAmount)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className="bg-green-500 text-white hover:bg-green-500 px-2 py-0.5 text-xs font-semibold">
                              AUTORIZADO
                            </Badge>
                            {auth.isRedeemed && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                Canjeado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <small>{auth.authFolio || "N/A"}</small>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination controls for Authorized Discounts */}
                {summary?.authorizedDiscounts && summary.authorizedDiscounts.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {getPaginatedData(summary.authorizedDiscounts, salesDiscountsPage).length} de {summary.authorizedDiscounts.length} registros
                    </div>
                    {renderPaginationControls(salesDiscountsPage, setSalesDiscountsPage, summary.authorizedDiscounts)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Expenses and Purchases Section with Tabs */}
      {((summary.expenses && summary.expenses.length > 0) || (summary.buys && summary.buys.length > 0)) && (
        <Card className="shadow-sm mb-4 rounded-[15px]">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h5 className="font-bold mb-0">Compras y Gastos</h5>
            </div>

            <Tabs defaultValue="expenses" className="w-full">
              <div className="px-4 pt-3 border-b">
                <TabsList className="bg-transparent h-auto p-0 gap-0">
                  <TabsTrigger
                    value="expenses"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Gastos ({summary.expenses?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="purchases"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Package size={16} className="mr-2" />
                    Compras en Efectivo ({summary.buys?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="expenses" className="mt-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        FOLIO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        FECHA
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        CONCEPTO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        USUARIO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        IMPORTE
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!summary.expenses || summary.expenses.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <ShoppingCart
                            size={48}
                            className="mb-3 opacity-50 mx-auto"
                          />
                          <p className="mb-0">No se encontraron gastos</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedData(summary.expenses, expensesPage).map((expense) => (
                        <TableRow key={expense._id}>
                          <TableCell className="px-4 py-3">
                            <span className="font-semibold">
                              #{expense.folio}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <small>{formatDate(expense.paymentDate)}</small>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="font-semibold">{expense.concept}</div>
                            {expense.conceptDescription && (
                              <small className="text-muted-foreground">
                                {expense.conceptDescription}
                              </small>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="text-muted-foreground">
                              {expense.user}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="font-bold text-red-600">
                              {formatCurrency(expense.total)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination controls for Expenses */}
                {summary.expenses && summary.expenses.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {getPaginatedData(summary.expenses, expensesPage).length} de {summary.expenses.length} registros
                    </div>
                    {renderPaginationControls(expensesPage, setExpensesPage, summary.expenses)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="purchases" className="mt-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        FOLIO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        FECHA
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        CONCEPTO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        PROVEEDOR
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        MÉTODO PAGO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        USUARIO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        IMPORTE
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!summary.buys || summary.buys.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <Package
                            size={48}
                            className="mb-3 opacity-50 mx-auto"
                          />
                          <p className="mb-0">No se encontraron compras</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedData(summary.buys, purchasesPage).map((buy) => (
                        <TableRow key={buy._id}>
                          <TableCell className="px-4 py-3">
                            <span className="font-semibold">#{buy.folio}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <small>{formatDate(buy.paymentDate)}</small>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="font-semibold">{buy.concept}</div>
                            {buy.description && (
                              <small className="text-muted-foreground">
                                {buy.description}
                              </small>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="text-muted-foreground">
                              {buy.provider}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {buy.paymentMethod.split(", ").map((method, idx) => (
                              <Badge
                                key={idx}
                                className={`mr-1 mb-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  method.toLowerCase().includes("efectivo")
                                    ? "bg-green-500 text-white hover:bg-green-500"
                                    : method.toLowerCase().includes("tarjeta")
                                    ? "bg-cyan-500 text-white hover:bg-cyan-500"
                                    : method.toLowerCase().includes("transferencia")
                                    ? "bg-primary text-primary-foreground hover:bg-primary"
                                    : "bg-gray-500 text-white hover:bg-gray-500"
                                }`}
                              >
                                {method}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="text-muted-foreground">
                              {buy.user}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="font-bold text-red-600">
                              {formatCurrency(buy.amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination controls for Purchases */}
                {summary.buys && summary.buys.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {getPaginatedData(summary.buys, purchasesPage).length} de {summary.buys.length} registros
                    </div>
                    {renderPaginationControls(purchasesPage, setPurchasesPage, summary.buys)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Staff Information */}
      <Card className="shadow-sm rounded-[15px]">
        <CardHeader className="px-2 py-1">
          <CardTitle className="text-sm font-medium">Información del Personal</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <h4 className="font-semibold mb-1 text-sm">Cajero</h4>
              {summary.cashRegister.activeUser ? (
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Nombre:</span>{" "}
                    {summary.cashRegister.activeUser.profile.fullName}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Usuario:</span>{" "}
                    {summary.cashRegister.activeUser.username}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {summary.cashRegister.activeUser.email}
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
                  {summary.cashRegister.managerId.profile.fullName}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Usuario:</span>{" "}
                  {summary.cashRegister.managerId.username}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {summary.cashRegister.managerId.email}
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