"use client";

import React, { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RedeemFolioConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (folio: string) => Promise<void>;
  saleOrderNumber: string;
}

const RedeemFolioConfirmDialog: React.FC<RedeemFolioConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  saleOrderNumber,
}) => {
  const [folio, setFolio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!folio.trim()) return;

    try {
      setIsSubmitting(true);
      await onConfirm(folio.trim());
      // Si llega aqui, fue exitoso
      handleClose();
    } catch (error: any) {
      // Mostrar el error en un toast
      const errorMessage = error?.message || error?.error?.message || "Error al canjear el folio de autorizacion";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFolio("");
    onHide();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && folio.trim() && !isSubmitting) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle size={24} className="text-green-500" />
            Canjear Folio de Autorizacion
          </DialogTitle>
          <DialogDescription>
            Estas seguro de que deseas canjear el folio de autorizacion para la orden{" "}
            <strong>{saleOrderNumber}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Al canjear el folio, la orden sera enviada automaticamente a produccion.
          </p>

          <div className="space-y-2">
            <Label htmlFor="folio" className="font-semibold">
              Folio de Autorizacion <span className="text-red-500">*</span>
            </Label>
            <Input
              id="folio"
              type="text"
              placeholder="Ej: 12345"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              maxLength={5}
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el folio de 5 digitos generado al aprobar el descuento
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !folio.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Canjeando...
              </>
            ) : (
              "Canjear Folio"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RedeemFolioConfirmDialog;
