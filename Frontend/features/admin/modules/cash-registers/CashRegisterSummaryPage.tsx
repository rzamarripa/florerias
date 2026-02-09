"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  ArrowLeft,
  DoorClosed,
  Loader2,
  ShoppingCart,
  Package,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { cashRegistersService } from "./services/cashRegisters";
import { CashRegisterSummary } from "./types";
import { generateCashRegisterTicket } from "./utils/generateCashRegisterTicket";
import { useUserSessionStore } from "@/stores/userSessionStore";
import CloseConfirmDialog from "./components/CloseConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CashRegisterSummaryPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cashRegisterId = searchParams.get("id");
  const { user } = useUserSessionStore();

  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // Pagination states
  const [paginationState, setPaginationState] = useState<{ [key: string]: number }>({});
  const [expensesPage, setExpensesPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [discountAuthsPage, setDiscountAuthsPage] = useState(1);
  const [salesCanceledPage, setSalesCanceledPage] = useState(1);
  const [salesDiscountsPage, setSalesDiscountsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (cashRegisterId) {
      loadSummary();
    } else {
      toast.error("ID de caja no proporcionado");
      router.push("/ventas/cajas");
    }
  }, [cashRegisterId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await cashRegistersService.getCashRegisterSummary(
        cashRegisterId!
      );

      if (response.success && response.data) {
        setSummary(response.data);
        
        // LOG DETALLADO DE MÉTODOS DE PAGO EN FRONTEND
        console.log('\n========== MÉTODOS DE PAGO RECIBIDOS EN FRONTEND ==========');
        console.log('Caja:', response.data.cashRegister.name);
        console.log('ID de caja:', cashRegisterId);
        
        if (response.data.paymentsByMethod) {
          const paymentsByMethod = response.data.paymentsByMethod;
          const methodNames = Object.keys(paymentsByMethod);
          
          console.log('\nMétodos de pago encontrados:', methodNames.length);
          console.log('Lista de métodos:', methodNames);
          console.log('\nDesglose detallado:');
          console.log('----------------------------');
          
          let totalGeneral = 0;
          methodNames.forEach((method) => {
            const data = paymentsByMethod[method];
            console.log(`\n💳 ${method}:`);
            console.log(`   - Cantidad de pagos: ${data.count}`);
            console.log(`   - Monto total: $${data.total.toFixed(2)}`);
            console.log(`   - Promedio: $${(data.total / data.count).toFixed(2)}`);
            console.log(`   - Primeros 3 pagos:`, data.payments.slice(0, 3).map(p => ({
              orden: p.orderNumber,
              monto: p.amount,
              cliente: p.clientName
            })));
            totalGeneral += data.total;
          });
          
          console.log('\n----------------------------');
          console.log('Total general de todos los métodos: $' + totalGeneral.toFixed(2));
          console.log('Total de ventas reportado:', response.data.totals.totalSales);
          console.log('Diferencia:', (totalGeneral - response.data.totals.totalSales).toFixed(2));
        } else {
          console.log('\n⚠️ No se encontraron datos de paymentsByMethod');
        }
        
        console.log('============================================\n');
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el resumen de la caja");
      console.error("Error loading cash register summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAndPrintTicket = (remainingBalance: number) => {
    if (!summary || !user) return;

    try {
      // Generar numero de folio unico basado en timestamp
      const folioNumber = `CORTE-${summary.cashRegister._id
        .slice(-6)
        .toUpperCase()}-${Date.now().toString().slice(-6)}`;

      // Obtener nombre del cajero
      const closedBy = user.profile?.fullName || "Cajero";

      // Fecha de cierre
      const closureDate = new Date().toISOString();

      // Generar el HTML del ticket
      const ticketHTML = generateCashRegisterTicket(summary, {
        closedBy,
        closureDate,
        folioNumber,
        remainingBalance,
      });

      // Crear una nueva ventana para imprimir
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();

        // Esperar a que se cargue el contenido antes de imprimir
        printWindow.onload = () => {
          printWindow.focus();
        };
      } else {
        toast.error(
          "No se pudo abrir la ventana de impresion. Verifica que no este bloqueada por el navegador."
        );
      }
    } catch (error) {
      console.error("Error generando ticket:", error);
      toast.error("Error al generar el ticket de cierre");
    }
  };

  const handleCloseCashRegister = async (remainingBalance: number) => {
    if (!cashRegisterId) return;

    try {
      setClosing(true);
      const response = await cashRegistersService.closeCashRegister(
        cashRegisterId,
        remainingBalance
      );

      if (response.success) {
        toast.success(response.message || "Caja cerrada exitosamente");

        // Generar e imprimir el ticket despues del cierre exitoso
        generateAndPrintTicket(remainingBalance);

        // Cerrar el dialogo
        setShowCloseDialog(false);

        // Pequeno delay para dar tiempo a que se abra la ventana de impresion
        // antes de redirigir
        setTimeout(() => {
          router.push("/ventas/cajas");
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cerrar la caja");
      console.error("Error closing cash register:", error);
    } finally {
      setClosing(false);
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

  // Pagination helper functions
  const getPaginatedData = <T,>(data: T[], page: number): T[] => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]): number => {
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  };

  // Get payment methods from paymentsByMethod (for payments) or ordersByPaymentMethod (for orders)
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
  }, [paymentMethods]);

  // Helper function to get paginated payments for a specific payment method
  const getPaginatedPaymentsForMethod = (methodName: string, page: number) => {
    if (!summary?.paymentsByMethod || !summary.paymentsByMethod[methodName]) {
      return [];
    }
    const payments = summary.paymentsByMethod[methodName].payments;
    return getPaginatedData(payments, page);
  };

  // Helper function to get paginated orders for a specific payment method (backward compatibility)
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

  // Helper function to get total pages for orders of a payment method (backward compatibility)
  const getTotalPagesForMethod = (methodName: string) => {
    if (!summary?.ordersByPaymentMethod || !summary.ordersByPaymentMethod[methodName]) {
      return 0;
    }
    return getTotalPages(summary.ordersByPaymentMethod[methodName].orders);
  };

  // Fallback for old logic (if backend doesn't support ordersByPaymentMethod yet)
  const regularOrders = React.useMemo(() => {
    if (summary?.ordersByPaymentMethod) return [];
    if (!summary?.orders) return [];
    return summary.orders.filter((order) => {
      const paymentLower = order.paymentMethod.toLowerCase();
      const isStoreCredit =
        paymentLower === "crédito" ||
        paymentLower === "credito" ||
        (paymentLower.includes("crédito") &&
          !paymentLower.includes("tarjeta")) ||
        (paymentLower.includes("credito") && !paymentLower.includes("tarjeta"));
      return !isStoreCredit;
    });
  }, [summary?.orders, summary?.ordersByPaymentMethod]);

  const creditOrders = React.useMemo(() => {
    if (summary?.ordersByPaymentMethod) return [];
    if (!summary?.orders) return [];
    return summary.orders.filter((order) => {
      const paymentLower = order.paymentMethod.toLowerCase();
      const isStoreCredit =
        paymentLower === "crédito" ||
        paymentLower === "credito" ||
        (paymentLower.includes("crédito") &&
          !paymentLower.includes("tarjeta")) ||
        (paymentLower.includes("credito") && !paymentLower.includes("tarjeta"));
      return isStoreCredit;
    });
  }, [summary?.orders, summary?.ordersByPaymentMethod]);
  
  // Debug logging to check data
  React.useEffect(() => {
    if (summary) {
      console.log("Total orders:", summary.orders?.length || 0);
      if (summary.ordersByPaymentMethod) {
        console.log("Orders by payment method:", summary.ordersByPaymentMethod);
      } else {
        console.log("Regular orders:", regularOrders.length);
        console.log("Credit orders:", creditOrders.length);
      }
      console.log("Expenses:", summary.expenses?.length || 0);
      console.log("Purchases:", summary.buys?.length || 0);
      console.log("Discount Auths:", summary.discountAuths?.length || 0);
    }
  }, [summary, regularOrders, creditOrders]);

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-3">
            Cargando resumen de la caja...
          </p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No se pudo cargar el resumen de la caja
          </p>
          <Button onClick={() => router.push("/ventas/cajas")} className="mt-4">
            Volver a Cajas Registradoras
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/ventas/cajas")}
            className="rounded-full w-10 h-10"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="mb-1 font-bold text-2xl">
              Resumen de Cierre de Caja
            </h2>
            <p className="text-muted-foreground mb-0">
              {summary.cashRegister.name} -{" "}
              {summary.cashRegister.branchId.branchName}
            </p>
          </div>
        </div>
      </div>

      {/* Totales Section */}
      <Card className="shadow-sm mb-4 rounded-[15px]">
        <CardContent className="p-4">
          <h5 className="font-bold mb-4">Esta caja cuenta actualmente con:</h5>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-muted-foreground mb-1 text-sm">
                Saldo Inicial
              </div>
              <div className="font-bold text-xl">
                {formatCurrency(summary.totals.initialBalance)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-muted-foreground mb-1 text-sm">
                ( + ) Ventas
              </div>
              <div className="font-bold text-xl text-green-600">
                {formatCurrency(summary.totals.totalSales)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-muted-foreground mb-1 text-sm">
                ( - ) Gastos
              </div>
              <div className="font-bold text-xl text-red-600">
                {formatCurrency(summary.totals.totalExpenses)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-muted-foreground mb-1 text-sm">
                ( = ) Saldo Total
              </div>
              <div className="font-bold text-2xl text-primary">
                {formatCurrency(summary.totals.currentBalance)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Section with Tabs */}
      <Card className="shadow-sm mb-4 rounded-[15px]">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h5 className="font-bold mb-0">Detalle de Ventas</h5>
          </div>

          <Tabs defaultValue={paymentMethods[0] || "regular"} className="w-full">
            <div className="px-4 pt-3 border-b">
              <TabsList className="bg-transparent h-auto p-0 gap-0 flex-wrap">
                {summary?.paymentsByMethod || summary?.ordersByPaymentMethod ? (
                  // Dynamic tabs based on payment methods
                  paymentMethods.map((methodName) => (
                    <TabsTrigger
                      key={methodName}
                      value={methodName}
                      className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      {methodName} ({summary.paymentsByMethod?.[methodName]?.count || summary.ordersByPaymentMethod?.[methodName]?.count || 0})
                    </TabsTrigger>
                  ))
                ) : (
                  // Fallback to old static tabs
                  <>
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
                  </>
                )}
              </TabsList>
            </div>

            {/* Dynamic Tab Contents */}
            {summary?.paymentsByMethod ? (
              // Dynamic tab content for payments
              paymentMethods.map((methodName) => (
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
                      {summary.paymentsByMethod[methodName].payments.length === 0 ? (
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
                  {summary.paymentsByMethod[methodName].payments.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {getPaginatedPaymentsForMethod(methodName, paginationState[methodName] || 1).length} de {summary.paymentsByMethod[methodName].payments.length} pagos
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPaginationState(prev => ({
                              ...prev,
                              [methodName]: Math.max(1, (prev[methodName] || 1) - 1)
                            }));
                          }}
                          disabled={(paginationState[methodName] || 1) === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        
                        <div className="flex items-center px-3 text-sm">
                          Página {paginationState[methodName] || 1} de {getTotalPagesForPaymentsMethod(methodName)}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPaginationState(prev => ({
                              ...prev,
                              [methodName]: Math.min(getTotalPagesForPaymentsMethod(methodName), (prev[methodName] || 1) + 1)
                            }));
                          }}
                          disabled={(paginationState[methodName] || 1) === getTotalPagesForPaymentsMethod(methodName)}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))
            ) : summary?.ordersByPaymentMethod ? (
              // Dynamic tab content for each payment method
              paymentMethods.map((methodName) => (
                <TabsContent key={methodName} value={methodName} className="mt-0">
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
                          FORMA PAGO
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          CLIENTE
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          VENTA
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          DESCUENTO
                        </TableHead>
                        <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                          IMPORTE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.ordersByPaymentMethod[methodName].orders.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <Wallet size={48} className="mb-3 opacity-50 mx-auto" />
                            <p className="mb-0">
                              No se encontraron ventas con {methodName}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        getPaginatedOrdersForMethod(methodName, paginationState[methodName] || 1).map((order, index) => (
                          <TableRow key={order._id}>
                            <TableCell className="px-4 py-3">
                              {((paginationState[methodName] || 1) - 1) * ITEMS_PER_PAGE + index + 1}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <small>{formatDate(order.createdAt)}</small>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {order.paymentMethod
                                .split(", ")
                                .map((method, idx) => (
                                  <Badge
                                    key={idx}
                                    className={`mr-1 mb-1 px-2 py-1 rounded-full text-xs font-medium ${
                                      method.toLowerCase().includes("efectivo")
                                        ? "bg-green-500 text-white hover:bg-green-500"
                                        : method.toLowerCase().includes("tarjeta")
                                        ? "bg-cyan-500 text-white hover:bg-cyan-500"
                                        : method
                                            .toLowerCase()
                                            .includes("transferencia")
                                        ? "bg-primary text-primary-foreground hover:bg-primary"
                                        : "bg-gray-500 text-white hover:bg-gray-500"
                                    }`}
                                  >
                                    {method}
                                  </Badge>
                                ))}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="font-semibold">
                                {order.clientName}
                              </div>
                              <small className="text-muted-foreground">
                                Para: {order.recipientName}
                              </small>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <div>{order.orderNumber}</div>
                                <small className="text-muted-foreground">
                                  {order.itemsCount}{" "}
                                  {order.itemsCount === 1
                                    ? "producto"
                                    : "productos"}
                                </small>
                                {order.status === "cancelado" && (
                                  <Badge className="bg-red-500 text-white hover:bg-red-500 px-2 py-0.5 text-xs font-semibold w-fit">
                                    CANCELADA
                                  </Badge>
                                )}
                                {order.discount && order.discount > 0 && (
                                  <Badge className="bg-yellow-500 text-white hover:bg-yellow-500 px-2 py-0.5 text-xs font-semibold w-fit">
                                    CON DESCUENTO
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {order.discount && order.discount > 0 ? (
                                <span className="font-bold text-orange-600">
                                  {formatCurrency(order.discount)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span
                                className={`font-bold ${
                                  order.status === "cancelado"
                                    ? "line-through text-red-500"
                                    : ""
                                }`}
                              >
                                {formatCurrency(order.advance)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination controls */}
                  {summary.ordersByPaymentMethod[methodName].orders.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {getPaginatedOrdersForMethod(methodName, paginationState[methodName] || 1).length} de {summary.ordersByPaymentMethod[methodName].orders.length} registros
                      </div>
                      {getTotalPagesForMethod(methodName) > 1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPaginationState(prev => ({ ...prev, [methodName]: 1 }))}
                            disabled={(paginationState[methodName] || 1) === 1}
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPaginationState(prev => ({ ...prev, [methodName]: (prev[methodName] || 1) - 1 }))}
                            disabled={(paginationState[methodName] || 1) === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          {[...Array(getTotalPagesForMethod(methodName))].map((_, index) => {
                            const pageNumber = index + 1;
                            const totalPages = getTotalPagesForMethod(methodName);
                            const currentPage = paginationState[methodName] || 1;
                            if (
                              pageNumber === 1 ||
                              pageNumber === totalPages ||
                              (pageNumber >= currentPage - 1 &&
                                pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <Button
                                  key={pageNumber}
                                  variant={
                                    pageNumber === currentPage ? "default" : "outline"
                                  }
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setPaginationState(prev => ({ ...prev, [methodName]: pageNumber }))}
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
                            onClick={() => setPaginationState(prev => ({ ...prev, [methodName]: (prev[methodName] || 1) + 1 }))}
                            disabled={(paginationState[methodName] || 1) === getTotalPagesForMethod(methodName)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPaginationState(prev => ({ ...prev, [methodName]: getTotalPagesForMethod(methodName) }))}
                            disabled={(paginationState[methodName] || 1) === getTotalPagesForMethod(methodName)}
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))
            ) : (
              // Fallback: keep the old static tabs structure
              <>
                <TabsContent value="regular" className="mt-0">
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
                      FORMA PAGO
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      CLIENTE
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      VENTA
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      DESCUENTO
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      IMPORTE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Wallet size={48} className="mb-3 opacity-50 mx-auto" />
                        <p className="mb-0">
                          No se encontraron ventas regulares
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedData(regularOrders, paginationState['regular'] || 1).map((order, index) => (
                      <TableRow key={order._id}>
                        <TableCell className="px-4 py-3">
                          {((paginationState['regular'] || 1) - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <small>{formatDate(order.createdAt)}</small>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {order.paymentMethod
                            .split(", ")
                            .map((method, idx) => (
                              <Badge
                                key={idx}
                                className={`mr-1 mb-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  method.toLowerCase().includes("efectivo")
                                    ? "bg-green-500 text-white hover:bg-green-500"
                                    : method.toLowerCase().includes("tarjeta")
                                    ? "bg-cyan-500 text-white hover:bg-cyan-500"
                                    : method
                                        .toLowerCase()
                                        .includes("transferencia")
                                    ? "bg-primary text-primary-foreground hover:bg-primary"
                                    : "bg-gray-500 text-white hover:bg-gray-500"
                                }`}
                              >
                                {method}
                              </Badge>
                            ))}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="font-semibold">
                            {order.clientName}
                          </div>
                          <small className="text-muted-foreground">
                            Para: {order.recipientName}
                          </small>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div>{order.orderNumber}</div>
                            <small className="text-muted-foreground">
                              {order.itemsCount}{" "}
                              {order.itemsCount === 1
                                ? "producto"
                                : "productos"}
                            </small>
                            {order.status === "cancelado" && (
                              <Badge className="bg-red-500 text-white hover:bg-red-500 px-2 py-0.5 text-xs font-semibold w-fit">
                                CANCELADA
                              </Badge>
                            )}
                            {order.discount && order.discount > 0 && (
                              <Badge className="bg-yellow-500 text-white hover:bg-yellow-500 px-2 py-0.5 text-xs font-semibold w-fit">
                                CON DESCUENTO
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {order.discount && order.discount > 0 ? (
                            <span className="font-bold text-orange-600">
                              {formatCurrency(order.discount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span
                            className={`font-bold ${
                              order.status === "cancelado"
                                ? "line-through text-red-500"
                                : ""
                            }`}
                          >
                            {formatCurrency(order.advance)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination controls for Regular Sales */}
              {regularOrders.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {getPaginatedData(regularOrders, paginationState['regular'] || 1).length} de {regularOrders.length} registros
                  </div>
                  {getTotalPages(regularOrders) > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPaginationState(prev => ({ ...prev, regular: 1 }))}
                        disabled={(paginationState['regular'] || 1) === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPaginationState(prev => ({ ...prev, regular: (prev['regular'] || 1) - 1 }))}
                        disabled={(paginationState['regular'] || 1) === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {[...Array(getTotalPages(regularOrders))].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalPages(regularOrders);
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= (paginationState['regular'] || 1) - 1 &&
                            pageNumber <= (paginationState['regular'] || 1) + 1)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === (paginationState['regular'] || 1) ? "default" : "outline"
                              }
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPaginationState(prev => ({ ...prev, regular: pageNumber }))}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === (paginationState['regular'] || 1) - 2 ||
                          pageNumber === (paginationState['regular'] || 1) + 2
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
                        onClick={() => setPaginationState(prev => ({ ...prev, regular: (prev['regular'] || 1) + 1 }))}
                        disabled={(paginationState['regular'] || 1) === getTotalPages(regularOrders)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPaginationState(prev => ({ ...prev, regular: getTotalPages(regularOrders) }))}
                        disabled={(paginationState['regular'] || 1) === getTotalPages(regularOrders)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Credit Sales Tab */}
            <TabsContent value="credit" className="mt-0">
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
                      CLIENTE
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      VENTA
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      TOTAL
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      ABONADO
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                      SALDO
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Wallet size={48} className="mb-3 opacity-50 mx-auto" />
                        <p className="mb-0">
                          No se encontraron ventas a crédito
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedData(creditOrders, paginationState['credit'] || 1).map((order, index) => (
                      <TableRow key={order._id}>
                        <TableCell className="px-4 py-3">
                          {((paginationState['credit'] || 1) - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <small>{formatDate(order.createdAt)}</small>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="font-semibold">
                            {order.clientName}
                          </div>
                          <small className="text-muted-foreground">
                            Para: {order.recipientName}
                          </small>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div>{order.orderNumber}</div>
                            <small className="text-muted-foreground">
                              {order.itemsCount}{" "}
                              {order.itemsCount === 1
                                ? "producto"
                                : "productos"}
                            </small>
                            <Badge className="bg-orange-500 text-white hover:bg-orange-500 px-2 py-0.5 text-xs font-semibold w-fit">
                              CRÉDITO
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-bold">
                            {formatCurrency(order.total)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-bold text-green-600">
                            {formatCurrency(order.advance)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-bold text-red-600">
                            {formatCurrency(order.total - order.advance)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination controls for Credit Sales */}
              {creditOrders.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {getPaginatedData(creditOrders, paginationState['credit'] || 1).length} de {creditOrders.length} registros
                  </div>
                  {getTotalPages(creditOrders) > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPaginationState(prev => ({ ...prev, credit: 1 }))}
                        disabled={(paginationState['credit'] || 1) === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPaginationState(prev => ({ ...prev, credit: (prev['credit'] || 1) - 1 }))}
                        disabled={(paginationState['credit'] || 1) === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {[...Array(getTotalPages(creditOrders))].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalPages(creditOrders);
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= (paginationState['credit'] || 1) - 1 &&
                            pageNumber <= (paginationState['credit'] || 1) + 1)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === (paginationState['credit'] || 1) ? "default" : "outline"
                              }
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPaginationState(prev => ({ ...prev, credit: pageNumber }))}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === (paginationState['credit'] || 1) - 2 ||
                          pageNumber === (paginationState['credit'] || 1) + 2
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
                        onClick={() => setPaginationState(prev => ({ ...prev, credit: (prev['credit'] || 1) + 1 }))}
                        disabled={(paginationState['credit'] || 1) === getTotalPages(creditOrders)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPaginationState(prev => ({ ...prev, credit: getTotalPages(creditOrders) }))}
                        disabled={(paginationState['credit'] || 1) === getTotalPages(creditOrders)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Sales Special Section with Tabs - Canceled Orders and Authorized Discounts */}
      {(summary?.canceledOrders?.length > 0 || summary?.authorizedDiscounts?.length > 0) && (
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
                            {order.paymentMethod
                              .split(", ")
                              .map((method, idx) => (
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSalesCanceledPage(Math.max(1, salesCanceledPage - 1))}
                        disabled={salesCanceledPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center px-3 text-sm">
                        Página {salesCanceledPage} de {getTotalPages(summary.canceledOrders)}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSalesCanceledPage(Math.min(getTotalPages(summary.canceledOrders), salesCanceledPage + 1))}
                        disabled={salesCanceledPage === getTotalPages(summary.canceledOrders)}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
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
                        FECHA APROBACIÓN
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        NO. ORDEN
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        SOLICITADO POR
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        AUTORIZADO POR
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        TIPO
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        VALOR
                      </TableHead>
                      <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                        MONTO DESCUENTO
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
                          colSpan={9}
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
                            <small>{auth.approvedAt ? formatDate(auth.approvedAt) : formatDate(auth.createdAt)}</small>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="font-semibold">
                              {auth.orderNumber}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {auth.requestedBy}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {auth.managerId}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className="bg-blue-500 text-white hover:bg-blue-500 px-2 py-1 rounded-full text-xs">
                              {auth.discountType === 'porcentaje' ? 'PORCENTAJE' : 'CANTIDAD'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="font-semibold">
                              {auth.discountType === 'porcentaje' 
                                ? `${auth.discountValue}%` 
                                : formatCurrency(auth.discountValue)
                              }
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="font-bold text-orange-600">
                              {formatCurrency(auth.discountAmount)}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-500 text-white hover:bg-green-500 px-2 py-0.5 text-xs font-semibold">
                                AUTORIZADO
                              </Badge>
                              <span className="font-mono font-semibold">
                                #{auth.authFolio}
                              </span>
                            </div>
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSalesDiscountsPage(Math.max(1, salesDiscountsPage - 1))}
                        disabled={salesDiscountsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center px-3 text-sm">
                        Página {salesDiscountsPage} de {getTotalPages(summary.authorizedDiscounts)}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSalesDiscountsPage(Math.min(getTotalPages(summary.authorizedDiscounts), salesDiscountsPage + 1))}
                        disabled={salesDiscountsPage === getTotalPages(summary.authorizedDiscounts)}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Expenses & Purchases Section with Tabs */}
      <Card className="shadow-sm mb-4 rounded-[15px]">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h5 className="font-bold mb-0">Gastos y Compras</h5>
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
                  Compras ({summary.buys?.length || 0})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Expenses Tab */}
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
              {summary.expenses && summary.expenses.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {getPaginatedData(summary.expenses, expensesPage).length} de {summary.expenses.length} registros
                  </div>
                  {getTotalPages(summary.expenses) > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpensesPage(1)}
                        disabled={expensesPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpensesPage(expensesPage - 1)}
                        disabled={expensesPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {[...Array(getTotalPages(summary.expenses))].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalPages(summary.expenses);
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= expensesPage - 1 &&
                            pageNumber <= expensesPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === expensesPage ? "default" : "outline"
                              }
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpensesPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === expensesPage - 2 ||
                          pageNumber === expensesPage + 2
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
                        onClick={() => setExpensesPage(expensesPage + 1)}
                        disabled={expensesPage === getTotalPages(summary.expenses)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpensesPage(getTotalPages(summary.expenses))}
                        disabled={expensesPage === getTotalPages(summary.expenses)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Purchases Tab */}
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
                            {buy.provider || "Sin proveedor"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className="bg-primary text-primary-foreground">
                            {buy.paymentMethod}
                          </Badge>
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
              {summary.buys && summary.buys.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {getPaginatedData(summary.buys, purchasesPage).length} de {summary.buys.length} registros
                  </div>
                  {getTotalPages(summary.buys) > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPurchasesPage(1)}
                        disabled={purchasesPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPurchasesPage(purchasesPage - 1)}
                        disabled={purchasesPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {[...Array(getTotalPages(summary.buys))].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalPages(summary.buys);
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= purchasesPage - 1 &&
                            pageNumber <= purchasesPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === purchasesPage ? "default" : "outline"
                              }
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPurchasesPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === purchasesPage - 2 ||
                          pageNumber === purchasesPage + 2
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
                        onClick={() => setPurchasesPage(purchasesPage + 1)}
                        disabled={purchasesPage === getTotalPages(summary.buys)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPurchasesPage(getTotalPages(summary.buys))}
                        disabled={purchasesPage === getTotalPages(summary.buys)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Discount Authorizations Section */}
      {summary.discountAuths && summary.discountAuths.length > 0 && (
        <Card className="shadow-sm mb-4 rounded-[15px]">
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center">
              <ReceiptText size={20} className="mr-2" />
              <h5 className="font-bold mb-0">Soliciitudes de Descuento</h5>
            </div>

            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    ORDEN
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    FECHA
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    SOLICITADO POR
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    DESCUENTO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    MENSAJE
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    ESTADO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    FOLIO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    GERENTE
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedData(summary.discountAuths, discountAuthsPage).map((auth) => (
                  <TableRow key={auth._id}>
                    <TableCell className="px-4 py-3">
                      <span className="font-semibold">{auth.orderNumber}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <small>{formatDate(auth.createdAt)}</small>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-muted-foreground">
                        {auth.requestedBy}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-bold text-orange-600">
                        {auth.discountType === "porcentaje"
                          ? `${auth.discountValue}%`
                          : formatCurrency(auth.discountValue)}
                      </span>
                      {auth.discountAmount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Total: {formatCurrency(auth.discountAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="max-w-xs">
                        <small className="text-muted-foreground line-clamp-2">
                          {auth.message}
                        </small>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {auth.isAuth === null ? (
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">
                          PENDIENTE
                        </Badge>
                      ) : auth.isAuth === true ? (
                        <Badge className="bg-green-500 text-white hover:bg-green-500">
                          APROBADO
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white hover:bg-red-500">
                          RECHAZADO
                        </Badge>
                      )}
                      {auth.isRedeemed && (
                        <Badge className="bg-blue-500 text-white hover:bg-blue-500 ml-1">
                          CANJEADO
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {auth.authFolio ? (
                        <span className="font-mono font-bold text-primary">
                          {auth.authFolio}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-muted-foreground text-sm">
                        {auth.managerId}
                      </span>
                      {auth.approvedAt && (
                        <div className="text-xs text-muted-foreground">
                          {formatDate(auth.approvedAt)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination controls for Discount Authorizations */}
            {summary.discountAuths.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {getPaginatedData(summary.discountAuths, discountAuthsPage).length} de {summary.discountAuths.length} registros
                </div>
                {getTotalPages(summary.discountAuths) > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDiscountAuthsPage(1)}
                      disabled={discountAuthsPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDiscountAuthsPage(discountAuthsPage - 1)}
                      disabled={discountAuthsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {[...Array(getTotalPages(summary.discountAuths))].map((_, index) => {
                      const pageNumber = index + 1;
                      const totalPages = getTotalPages(summary.discountAuths);
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= discountAuthsPage - 1 &&
                          pageNumber <= discountAuthsPage + 1)
                      ) {
                        return (
                          <Button
                            key={pageNumber}
                            variant={
                              pageNumber === discountAuthsPage ? "default" : "outline"
                            }
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDiscountAuthsPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        );
                      } else if (
                        pageNumber === discountAuthsPage - 2 ||
                        pageNumber === discountAuthsPage + 2
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
                      onClick={() => setDiscountAuthsPage(discountAuthsPage + 1)}
                      disabled={discountAuthsPage === getTotalPages(summary.discountAuths)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDiscountAuthsPage(getTotalPages(summary.discountAuths))}
                      disabled={discountAuthsPage === getTotalPages(summary.discountAuths)}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Close Cash Register Button */}
      <div className="text-center mb-4">
        <Button
          variant="destructive"
          size="lg"
          onClick={() => setShowCloseDialog(true)}
          disabled={closing}
          className="px-8 py-6 rounded-xl font-semibold shadow-lg"
        >
          <DoorClosed size={20} className="mr-2" />
          Cerrar Caja
        </Button>
      </div>

      {/* Close Confirmation Dialog */}
      <CloseConfirmDialog
        show={showCloseDialog}
        onHide={() => setShowCloseDialog(false)}
        onConfirm={handleCloseCashRegister}
        currentBalance={summary.totals.currentBalance}
        isClosing={closing}
      />
    </div>
  );
};

export default CashRegisterSummaryPage;
