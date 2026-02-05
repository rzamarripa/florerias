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
  const [regularSalesPage, setRegularSalesPage] = useState(1);
  const [creditSalesPage, setCreditSalesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [discountAuthsPage, setDiscountAuthsPage] = useState(1);
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

  // Filter orders by type (simplified to just Regular and Credit)
  const regularOrders = React.useMemo(() => {
    if (!summary?.orders) return [];
    return summary.orders.filter((order) => {
      const paymentLower = order.paymentMethod.toLowerCase();
      // Check if it's store credit (not credit card)
      const isStoreCredit =
        paymentLower === "crédito" ||
        paymentLower === "credito" ||
        (paymentLower.includes("crédito") &&
          !paymentLower.includes("tarjeta")) ||
        (paymentLower.includes("credito") && !paymentLower.includes("tarjeta"));

      // Include in regular if it's NOT store credit
      return !isStoreCredit;
    });
  }, [summary?.orders]);

  const creditOrders = React.useMemo(() => {
    if (!summary?.orders) return [];
    return summary.orders.filter((order) => {
      const paymentLower = order.paymentMethod.toLowerCase();
      // Check if it's store credit (not credit card)
      const isStoreCredit =
        paymentLower === "crédito" ||
        paymentLower === "credito" ||
        (paymentLower.includes("crédito") &&
          !paymentLower.includes("tarjeta")) ||
        (paymentLower.includes("credito") && !paymentLower.includes("tarjeta"));

      // Include in credit only if it IS store credit
      return isStoreCredit;
    });
  }, [summary?.orders]);
  
  // Debug logging to check data
  React.useEffect(() => {
    if (summary) {
      console.log("Total orders:", summary.orders?.length || 0);
      console.log("Regular orders:", regularOrders.length);
      console.log("Credit orders:", creditOrders.length);
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

            {/* Regular Sales Tab */}
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
                    getPaginatedData(regularOrders, regularSalesPage).map((order, index) => (
                      <TableRow key={order._id}>
                        <TableCell className="px-4 py-3">
                          {(regularSalesPage - 1) * ITEMS_PER_PAGE + index + 1}
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
                    Mostrando {getPaginatedData(regularOrders, regularSalesPage).length} de {regularOrders.length} registros
                  </div>
                  {getTotalPages(regularOrders) > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRegularSalesPage(1)}
                        disabled={regularSalesPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRegularSalesPage(regularSalesPage - 1)}
                        disabled={regularSalesPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {[...Array(getTotalPages(regularOrders))].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalPages(regularOrders);
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= regularSalesPage - 1 &&
                            pageNumber <= regularSalesPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === regularSalesPage ? "default" : "outline"
                              }
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setRegularSalesPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === regularSalesPage - 2 ||
                          pageNumber === regularSalesPage + 2
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
                        onClick={() => setRegularSalesPage(regularSalesPage + 1)}
                        disabled={regularSalesPage === getTotalPages(regularOrders)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRegularSalesPage(getTotalPages(regularOrders))}
                        disabled={regularSalesPage === getTotalPages(regularOrders)}
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
                    getPaginatedData(creditOrders, creditSalesPage).map((order, index) => (
                      <TableRow key={order._id}>
                        <TableCell className="px-4 py-3">
                          {(creditSalesPage - 1) * ITEMS_PER_PAGE + index + 1}
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
                    Mostrando {getPaginatedData(creditOrders, creditSalesPage).length} de {creditOrders.length} registros
                  </div>
                  {getTotalPages(creditOrders) > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCreditSalesPage(1)}
                        disabled={creditSalesPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCreditSalesPage(creditSalesPage - 1)}
                        disabled={creditSalesPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {[...Array(getTotalPages(creditOrders))].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalPages(creditOrders);
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= creditSalesPage - 1 &&
                            pageNumber <= creditSalesPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === creditSalesPage ? "default" : "outline"
                              }
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setCreditSalesPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        } else if (
                          pageNumber === creditSalesPage - 2 ||
                          pageNumber === creditSalesPage + 2
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
                        onClick={() => setCreditSalesPage(creditSalesPage + 1)}
                        disabled={creditSalesPage === getTotalPages(creditOrders)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCreditSalesPage(getTotalPages(creditOrders))}
                        disabled={creditSalesPage === getTotalPages(creditOrders)}
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
