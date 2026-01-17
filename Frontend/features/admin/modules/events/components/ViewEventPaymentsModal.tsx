"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Loader2, Info } from "lucide-react";
import { toast } from "react-toastify";
import { eventPaymentsService } from "../services/eventPayments";
import { EventPayment, Event } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ViewEventPaymentsModalProps {
  show: boolean;
  onHide: () => void;
  onPaymentDeleted?: () => void;
  event: Event;
}

const ViewEventPaymentsModal: React.FC<ViewEventPaymentsModalProps> = ({
  show,
  onHide,
  onPaymentDeleted,
  event,
}) => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<EventPayment[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cargar pagos del evento
  useEffect(() => {
    const loadPayments = async () => {
      if (!show) return;

      try {
        setLoading(true);
        const response = await eventPaymentsService.getEventPayments(event._id);
        if (response.data) {
          setPayments(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar los pagos");
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [show, event._id]);

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Estas seguro de eliminar este pago? Esta accion actualizara los saldos del evento.")) {
      return;
    }

    try {
      setDeletingId(paymentId);
      await eventPaymentsService.deleteEventPayment(paymentId);
      toast.success("Pago eliminado exitosamente");

      // Recargar pagos
      const response = await eventPaymentsService.getEventPayments(event._id);
      if (response.data) {
        setPayments(response.data);
      }

      onPaymentDeleted?.();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el pago");
    } finally {
      setDeletingId(null);
    }
  };

  const calculateTotals = () => {
    const totalPagos = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return {
      totalPagos,
      cantidadPagos: payments.length,
    };
  };

  const totals = calculateTotals();

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-bold">Pagos del Evento</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <strong>Folio:</strong> #{event.folio}
                  </div>
                  <div>
                    <strong>Cliente:</strong> {event.client.name} {event.client.lastName}
                  </div>
                  <div>
                    <strong>Fecha del Evento:</strong>{" "}
                    {new Date(event.eventDate).toLocaleDateString("es-MX")}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>Total del Evento:</strong>{" "}
                    <span className="font-bold">
                      ${event.totalAmount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <strong>Total Pagado:</strong>{" "}
                    <span className="font-bold text-green-600">
                      ${event.totalPaid.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <strong>Saldo Pendiente:</strong>{" "}
                    <span className="font-bold text-red-600">
                      ${event.balance.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">Cargando pagos...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No hay pagos registrados para este evento</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-3 py-2 font-semibold text-muted-foreground">FECHA</TableHead>
                    <TableHead className="px-3 py-2 font-semibold text-muted-foreground">METODO</TableHead>
                    <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-right">MONTO</TableHead>
                    <TableHead className="px-3 py-2 font-semibold text-muted-foreground">REGISTRADO POR</TableHead>
                    <TableHead className="px-3 py-2 font-semibold text-muted-foreground">NOTAS</TableHead>
                    <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-center">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id} className="border-b border-border/50">
                      <TableCell className="px-3 py-2">
                        {new Date(payment.paymentDate).toLocaleDateString("es-MX")}
                        <br />
                        <small className="text-muted-foreground">
                          {new Date(payment.paymentDate).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge className="px-2 py-1">
                          {payment.paymentMethod.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right font-bold text-green-600">
                        ${payment.amount.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {payment.user.username}
                        <br />
                        <small className="text-muted-foreground">{payment.branch.branchName}</small>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {payment.notes || "-"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeletePayment(payment._id)}
                          disabled={deletingId === payment._id}
                          className="rounded-full bg-red-100 hover:bg-red-200"
                          title="Eliminar pago"
                        >
                          {deletingId === payment._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} className="text-red-500" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-3 p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>Total de pagos registrados:</strong> {totals.cantidadPagos}
                  </div>
                  <div>
                    <strong>Suma de pagos:</strong>{" "}
                    <span className="text-lg font-bold text-green-600">
                      ${totals.totalPagos.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onHide}
            className="rounded-[10px]"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEventPaymentsModal;
