"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  ArrowLeft,
  DoorClosed,
  Loader2,
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
      const folioNumber = `CORTE-${summary.cashRegister._id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

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
        toast.error("No se pudo abrir la ventana de impresion. Verifica que no este bloqueada por el navegador.");
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

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-3">Cargando resumen de la caja...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto py-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se pudo cargar el resumen de la caja</p>
          <Button
            onClick={() => router.push("/ventas/cajas")}
            className="mt-4"
          >
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
            <h2 className="mb-1 font-bold text-2xl">Resumen de Cierre de Caja</h2>
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

      {/* Expenses Table Section */}
      {summary.expenses && summary.expenses.length > 0 && (
        <Card className="shadow-sm mb-4 rounded-[15px]">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h5 className="font-bold mb-0">Detalle de Gastos</h5>
            </div>

            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">FOLIO</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">FECHA</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">CONCEPTO</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">USUARIO</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">IMPORTE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="px-4 py-3">
                      <span className="font-semibold">#{expense.folio}</span>
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
                      <span className="text-muted-foreground">{expense.user}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-bold text-red-600">
                        {formatCurrency(expense.total)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sales Table Section */}
      <Card className="shadow-sm mb-4 rounded-[15px]">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h5 className="font-bold mb-0">Detalle de Ventas</h5>
          </div>

          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">No.</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">FECHA</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">FORMA PAGO</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">CLIENTE</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">VENTA</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">IMPORTE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Wallet size={48} className="mb-3 opacity-50 mx-auto" />
                    <p className="mb-0">No se encontraron ventas</p>
                  </TableCell>
                </TableRow>
              ) : (
                summary.orders.map((order, index) => (
                  <TableRow key={order._id}>
                    <TableCell className="px-4 py-3">{index + 1}</TableCell>
                    <TableCell className="px-4 py-3">
                      <small>{formatDate(order.createdAt)}</small>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {order.paymentMethod.split(', ').map((method, idx) => (
                        <Badge
                          key={idx}
                          className={`mr-1 mb-1 px-2 py-1 rounded-full text-xs font-medium ${
                            method.toLowerCase().includes('efectivo')
                              ? 'bg-green-500 text-white hover:bg-green-500'
                              : method.toLowerCase().includes('tarjeta') || method.toLowerCase().includes('credito')
                              ? 'bg-cyan-500 text-white hover:bg-cyan-500'
                              : method.toLowerCase().includes('transferencia')
                              ? 'bg-primary text-primary-foreground hover:bg-primary'
                              : 'bg-gray-500 text-white hover:bg-gray-500'
                          }`}
                        >
                          {method}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold">{order.clientName}</div>
                      <small className="text-muted-foreground">
                        Para: {order.recipientName}
                      </small>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div>{order.orderNumber}</div>
                      <small className="text-muted-foreground">
                        {order.itemsCount}{" "}
                        {order.itemsCount === 1 ? "producto" : "productos"}
                      </small>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-bold">
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
