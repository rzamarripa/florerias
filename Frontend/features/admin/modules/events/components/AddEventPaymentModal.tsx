"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Info } from "lucide-react";
import { toast } from "react-toastify";
import { eventPaymentsService } from "../services/eventPayments";
import { CreateEventPaymentData, Event, PaymentMethod } from "../types";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddEventPaymentModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  event: Event;
}

const AddEventPaymentModal: React.FC<AddEventPaymentModalProps> = ({
  show,
  onHide,
  onSuccess,
  event,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [formData, setFormData] = useState<CreateEventPaymentData>({
    eventId: event._id,
    amount: 0,
    paymentMethod: "",
    notes: "",
  });

  // Cargar metodos de pago
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await paymentMethodsService.getAllPaymentMethods({
          status: true,
          limit: 1000,
        });
        if (response.data) {
          setPaymentMethods(response.data);
        }
      } catch (error) {
        console.error("Error loading payment methods:", error);
      }
    };

    if (show) {
      loadPaymentMethods();
    }
  }, [show]);

  // Reiniciar eventId cuando cambie el evento
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      eventId: event._id,
    }));
  }, [event._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paymentMethod) {
      toast.error("Selecciona un metodo de pago");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (formData.amount > event.balance) {
      toast.error(`El monto no puede exceder el saldo pendiente ($${event.balance.toFixed(2)})`);
      return;
    }

    try {
      setLoading(true);
      await eventPaymentsService.createEventPayment(formData);
      toast.success("Pago registrado exitosamente");
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      eventId: event._id,
      amount: 0,
      paymentMethod: "",
      notes: "",
    });
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-bold">Registrar Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span><strong>Evento:</strong> Folio #{event.folio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><strong>Cliente:</strong> {event.client.name} {event.client.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><strong>Total del Evento:</strong></span>
                    <span className="font-bold">
                      ${event.totalAmount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span><strong>Total Pagado:</strong></span>
                    <span className="font-bold text-green-600">
                      ${event.totalPaid.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span><strong>Saldo Pendiente:</strong></span>
                    <span className="font-bold text-red-600">
                      ${event.balance.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Monto del Pago <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={event.balance}
                  placeholder="0.00"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="bg-muted/50 rounded-[10px] h-11"
                />
                <p className="text-sm text-muted-foreground">
                  Maximo: ${event.balance.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Metodo de Pago <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger className="w-full bg-muted/50 rounded-[10px] h-11">
                    <SelectValue placeholder="Seleccionar metodo de pago..." />
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
                <Label className="font-semibold">Notas (opcional)</Label>
                <Textarea
                  rows={3}
                  placeholder="Notas adicionales sobre el pago..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-muted/50 rounded-[10px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="rounded-[10px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-[10px] min-w-[120px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventPaymentModal;
