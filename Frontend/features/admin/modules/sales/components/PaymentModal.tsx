"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Trash2, Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { orderPaymentsService, OrderPayment } from "../services/orderPayments";
import { cashRegistersService, CashRegister } from "../services/cashRegisters";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { Sale } from "../types";

interface PaymentModalProps {
  show: boolean;
  onHide: () => void;
  sale: Sale;
  onPaymentAdded?: () => void;
}

interface PaymentMethod {
  _id: string;
  name: string;
  status: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  onHide,
  sale,
  onPaymentAdded,
}) => {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedCashRegister, setSelectedCashRegister] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [currentSale, setCurrentSale] = useState<Sale>(sale);
  const previousAdvanceRef = useRef<number>(sale.advance || 0);

  const userId = useUserSessionStore((state) => state.getUserId());

  // Socket listener para actualizaciones en tiempo real de esta orden especifica
  useOrderSocket({
    filters: {},
    onOrderCreated: () => {},
    onOrderUpdated: (updatedOrder) => {
      // Solo actualizar si es la misma orden que estamos viendo
      if (updatedOrder._id === sale._id) {
        const previousAdvance = previousAdvanceRef.current;
        const currentAdvance = updatedOrder.advance || 0;

        // Si hubo cambio en el pago, recargar la lista de pagos
        if (currentAdvance !== previousAdvance) {
          console.log(`[PaymentModal] Detectado cambio en pagos de orden ${updatedOrder.orderNumber}`);
          loadPayments();
          previousAdvanceRef.current = currentAdvance;
        }

        // Actualizar la informacion de la venta mostrada
        setCurrentSale(updatedOrder as Sale);

        // Notificar al componente padre para actualizar las tablas
        if (onPaymentAdded) {
          onPaymentAdded();
        }
      }
    },
    onOrderDeleted: () => {},
  });

  useEffect(() => {
    if (show && sale) {
      setCurrentSale(sale);
      previousAdvanceRef.current = sale.advance || 0;
      loadPayments();
      loadCashRegisters();
      loadPaymentMethods();
    }
  }, [show, sale]);

  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      const paymentsData = await orderPaymentsService.getOrderPayments(sale._id);
      setPayments(paymentsData);
    } catch (error: any) {
      console.error("Error loading payments:", error);
      toast.error(error.message || "Error al cargar los pagos");
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadCashRegisters = async () => {
    try {
      // Extraer el ID de la sucursal (puede ser string o objeto poblado)
      const branchId: string = typeof sale.branchId === 'string'
        ? sale.branchId
        : sale.branchId._id;

      const cashRegisterData = await cashRegistersService.getOpenCashRegistersByBranch(branchId);
      setCashRegisters(cashRegisterData);

      // Auto-seleccionar si solo hay una caja abierta
      if (cashRegisterData.length === 1) {
        setSelectedCashRegister(cashRegisterData[0]._id);
      }
    } catch (error: any) {
      console.error("Error loading cash registers:", error);
      toast.error(error.message || "Error al cargar las cajas registradoras");
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        status: true,
      });
      if (response.data) {
        setPaymentMethods(response.data);
      }
    } catch (error: any) {
      console.error("Error loading payment methods:", error);
      toast.error(error.message || "Error al cargar los metodos de pago");
    }
  };

  // Verificar si el metodo de pago seleccionado es efectivo
  const isEffectivoSelected = () => {
    if (!selectedPaymentMethod) return false;
    const method = paymentMethods.find(pm => pm._id === selectedPaymentMethod);
    return method?.name.toLowerCase() === 'efectivo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que la orden no este cancelada
    if (currentSale.status === "cancelado") {
      toast.error("No se pueden registrar pagos en una orden cancelada");
      return;
    }

    if (!userId) {
      toast.error("No se pudo obtener el ID del usuario");
      return;
    }

    const amountNum = parseFloat(amount);

    // Validaciones
    if (!amount || amountNum <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (amountNum > currentSale.remainingBalance) {
      toast.error(`El monto no puede exceder el saldo pendiente ($${currentSale.remainingBalance.toFixed(2)})`);
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Selecciona un metodo de pago");
      return;
    }

    // Solo validar caja si el metodo de pago es efectivo
    if (isEffectivoSelected() && !selectedCashRegister) {
      toast.error("Selecciona una caja registradora");
      return;
    }

    try {
      setSubmitting(true);

      await orderPaymentsService.createOrderPayment({
        orderId: sale._id,
        amount: amountNum,
        paymentMethod: selectedPaymentMethod,
        cashRegisterId: isEffectivoSelected() ? selectedCashRegister : null,
        registeredBy: userId,
        notes: notes.trim(),
      });

      toast.success("Pago registrado exitosamente");

      // Limpiar formulario
      setAmount("");
      setSelectedPaymentMethod("");
      setNotes("");

      // Recargar pagos
      await loadPayments();

      // Notificar al componente padre
      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Estas seguro de eliminar este pago?")) return;

    try {
      await orderPaymentsService.deleteOrderPayment(paymentId);
      toast.success("Pago eliminado exitosamente");
      await loadPayments();

      if (onPaymentAdded) {
        onPaymentAdded();
      }
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      toast.error(error.message || "Error al eliminar el pago");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span>Pagos de la Venta</span>
              </div>
              <div className="text-muted-foreground text-sm font-normal">
                {currentSale.orderNumber}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informacion de la venta */}
          <div className="p-3 bg-gray-100 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <small className="text-muted-foreground block">Cliente</small>
                <div className="font-semibold">{currentSale.clientInfo?.name || "N/A"}</div>
              </div>
              <div>
                <small className="text-muted-foreground block">Total de la venta</small>
                <div className="font-semibold">${currentSale.total.toFixed(2)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <small className="text-muted-foreground block">Anticipo inicial</small>
                <div className="font-semibold text-green-500">${(currentSale.advance - totalPaid).toFixed(2)}</div>
              </div>
              <div>
                <small className="text-muted-foreground block">Saldo pendiente</small>
                <div className="font-semibold text-red-500">${currentSale.remainingBalance.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Tabla de pagos realizados */}
          <div>
            <h6 className="font-semibold mb-3">Pagos Realizados</h6>
            {loadingPayments ? (
              <div className="text-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
              </div>
            ) : payments.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  No hay pagos adicionales registrados para esta venta.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Monto</TableHead>
                    <TableHead className="font-semibold">Metodo</TableHead>
                    <TableHead className="font-semibold">Caja</TableHead>
                    <TableHead className="font-semibold">Registrado por</TableHead>
                    <TableHead className="font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatDate(payment.date)}
                          {payment.isAdvance && (
                            <Badge variant="secondary">Anticipo</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-500">
                        ${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{payment.paymentMethod?.name || "N/A"}</TableCell>
                      <TableCell>{payment.cashRegisterId?.name || "N/A"}</TableCell>
                      <TableCell>{payment.registeredBy?.username || "N/A"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePayment(payment._id)}
                          className="h-8 w-8"
                          title={currentSale.status === "cancelado" ? "No se pueden eliminar pagos de ordenes canceladas" : "Eliminar pago"}
                          disabled={currentSale.status === "cancelado"}
                        >
                          <Trash2 className={`h-4 w-4 ${currentSale.status === "cancelado" ? "text-muted-foreground" : "text-red-500"}`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-gray-50">
                  <TableRow>
                    <TableCell className="font-bold">Total pagado adicional:</TableCell>
                    <TableCell className="font-bold text-green-500" colSpan={5}>
                      ${totalPaid.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>

          {/* Alerta si la orden esta cancelada */}
          {currentSale.status === "cancelado" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Orden Cancelada</AlertTitle>
              <AlertDescription>
                No se pueden registrar ni eliminar pagos en una orden cancelada.
              </AlertDescription>
            </Alert>
          )}

          {/* Formulario para nuevo pago */}
          {currentSale.remainingBalance > 0 && currentSale.status !== "cancelado" && (
            <div className="border-t pt-4">
              <h6 className="font-semibold mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Registrar Nuevo Pago
              </h6>

              {cashRegisters.length === 0 && paymentMethods.some(pm => pm.name.toLowerCase() === 'efectivo') ? (
                <Alert className="border-yellow-200 bg-yellow-50 mb-4">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    No hay cajas registradoras abiertas en esta sucursal. Las cajas solo son necesarias para pagos en efectivo.
                  </AlertDescription>
                </Alert>
              ) : null}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="font-semibold">
                      Monto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={currentSale.remainingBalance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximo: ${currentSale.remainingBalance.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="font-semibold">
                      Metodo de Pago <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedPaymentMethod}
                      onValueChange={setSelectedPaymentMethod}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un metodo" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method._id} value={method._id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cashRegister" className="font-semibold">
                      Caja Registradora {isEffectivoSelected() ? <span className="text-red-500">*</span> : "(solo para efectivo)"}
                    </Label>
                    <Select
                      value={selectedCashRegister}
                      onValueChange={setSelectedCashRegister}
                      disabled={!isEffectivoSelected()}
                    >
                      <SelectTrigger className={!isEffectivoSelected() ? "bg-gray-100" : ""}>
                        <SelectValue placeholder="Selecciona una caja" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashRegisters.map((cashRegister) => (
                          <SelectItem key={cashRegister._id} value={cashRegister._id}>
                            {cashRegister.name} - {cashRegister.branchId?.branchName || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isEffectivoSelected() && (
                      <p className="text-xs text-muted-foreground">
                        La caja registradora solo se requiere para pagos en efectivo
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="font-semibold">
                      Notas (opcional)
                    </Label>
                    <Textarea
                      id="notes"
                      rows={1}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Agrega notas sobre este pago..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onHide}
                    disabled={submitting}
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Registrar Pago
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
