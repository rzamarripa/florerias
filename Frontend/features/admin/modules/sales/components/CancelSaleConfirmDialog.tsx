"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CancelSaleConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (reason: string) => void;
  saleOrderNumber: string;
  isProcessing: boolean;
}

const CancelSaleConfirmDialog: React.FC<CancelSaleConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  saleOrderNumber,
  isProcessing,
}) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");

  // Limpiar el estado cuando se cierra el modal
  useEffect(() => {
    if (!show) {
      setCancellationReason("");
      setError("");
    }
  }, [show]);

  const handleConfirm = () => {
    if (!cancellationReason.trim()) {
      setError("El motivo de cancelacion es requerido");
      return;
    }
    if (cancellationReason.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }
    setError("");
    onConfirm(cancellationReason.trim());
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCancellationReason(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && !isProcessing && onHide()}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isProcessing}>
        <DialogHeader>
          <DialogTitle className="font-bold">Cancelar Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div
              className="rounded-full inline-flex items-center justify-center mb-3 w-20 h-20"
              style={{ backgroundColor: "#fff3cd" }}
            >
              <AlertTriangle className="h-10 w-10 text-yellow-500" />
            </div>
            <h5 className="mb-3 font-semibold">Estas seguro de cancelar esta venta?</h5>
            <p className="text-muted-foreground mb-2">
              Folio: <strong>{saleOrderNumber}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellationReason" className="font-semibold">
              Motivo de cancelacion <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cancellationReason"
              rows={3}
              placeholder="Escribe el motivo de la cancelacion..."
              value={cancellationReason}
              onChange={handleReasonChange}
              disabled={isProcessing}
              className={error ? "border-red-500" : ""}
              maxLength={500}
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <p className="text-muted-foreground text-xs">
              {cancellationReason.length}/500 caracteres
            </p>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Nota:</strong> Esta accion no se puede deshacer. La venta
              permanecera en el sistema con estado "Cancelado".
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onHide}
            disabled={isProcessing}
          >
            No, mantener venta
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing || !cancellationReason.trim()}
          >
            {isProcessing ? "Cancelando..." : "Si, cancelar venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSaleConfirmDialog;
