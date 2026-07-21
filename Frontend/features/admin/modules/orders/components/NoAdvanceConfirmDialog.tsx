"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface NoAdvanceConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

const NoAdvanceConfirmDialog: React.FC<NoAdvanceConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  isProcessing = false,
}) => {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Venta sin anticipo
          </DialogTitle>
          <DialogDescription>
            Esta venta no tiene anticipo registrado. ¿Deseas enviarla a
            producción de todas formas?
          </DialogDescription>
        </DialogHeader>
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
            onClick={onConfirm}
            disabled={isProcessing}
          >
            Continuar sin anticipo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoAdvanceConfirmDialog;
