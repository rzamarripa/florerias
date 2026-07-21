"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface DeliverPendingReasonDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (reason: string) => void;
  orderNumber?: string;
  remainingBalance: number;
  isProcessing?: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);

const DeliverPendingReasonDialog: React.FC<DeliverPendingReasonDialogProps> = ({
  show,
  onHide,
  onConfirm,
  orderNumber,
  remainingBalance,
  isProcessing = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setReason("");
      setError(null);
    }
  }, [show]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Entrega con saldo pendiente
          </DialogTitle>
          <DialogDescription>
            La orden {orderNumber ? `${orderNumber} ` : ""}tiene un saldo
            pendiente de {formatCurrency(remainingBalance)}. Indica el motivo
            por el que se entregará con saldo pendiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="deliveryPendingReason" className="font-semibold">
            Motivo <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="deliveryPendingReason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ej. El cliente pagará el saldo al momento de recoger otro pedido..."
            rows={4}
            maxLength={500}
            disabled={isProcessing}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{error ? <span className="text-red-500">{error}</span> : null}</span>
            <span>{reason.length}/500</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onHide}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !reason.trim()}
          >
            {isProcessing ? "Guardando..." : "Confirmar entrega"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliverPendingReasonDialog;
