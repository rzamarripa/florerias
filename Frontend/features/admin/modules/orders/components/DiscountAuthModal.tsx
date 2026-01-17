"use client";

import React, { useState } from "react";
import { Shield } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DiscountAuthModalProps {
  show: boolean;
  onHide: () => void;
  discount: number;
  discountType: "porcentaje" | "cantidad";
  onConfirm: (message: string) => void;
}

const DiscountAuthModal: React.FC<DiscountAuthModalProps> = ({
  show,
  onHide,
  discount,
  discountType,
  onConfirm,
}) => {
  const [discountRequestMessage, setDiscountRequestMessage] = useState("");
  const [requestingDiscount, setRequestingDiscount] = useState(false);

  const handleRequestDiscountAuth = async () => {
    if (!discountRequestMessage.trim()) {
      toast.error("Por favor ingresa un mensaje de solicitud");
      return;
    }

    if (discount <= 0) {
      toast.error("El valor del descuento debe ser mayor a 0");
      return;
    }

    setRequestingDiscount(true);

    // Llamar al callback del padre con el mensaje
    onConfirm(discountRequestMessage);

    // Limpiar y cerrar
    setDiscountRequestMessage("");
    setRequestingDiscount(false);
    onHide();

    toast.success("Descuento aplicado. Se creara la solicitud al guardar la orden.");
  };

  const handleClose = () => {
    setDiscountRequestMessage("");
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-yellow-500 text-white -m-6 mb-4 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2">
            <Shield size={24} />
            Confirmar Solicitud de Descuento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Informacion:</strong> El descuento se aplicara
              inmediatamente a la orden, pero necesita autorizacion del gerente
              antes de enviarse a produccion.
            </AlertDescription>
          </Alert>

          <div className="p-3 border rounded bg-gray-50">
            <h6 className="font-bold mb-2">Descuento solicitado:</h6>
            <p className="mb-0 text-lg text-blue-600">
              {discount} {discountType === "porcentaje" ? "%" : "$"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">
              Motivo de la solicitud <span className="text-red-500">*</span>
            </Label>
            <Textarea
              rows={4}
              placeholder="Describe el motivo por el cual solicitas este descuento..."
              value={discountRequestMessage}
              onChange={(e) => setDiscountRequestMessage(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              El gerente recibira esta solicitud junto con la orden creada. Si la
              rechaza, la orden sera cancelada automaticamente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={requestingDiscount}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            className="bg-yellow-500 hover:bg-yellow-600"
            onClick={handleRequestDiscountAuth}
            disabled={requestingDiscount || !discountRequestMessage.trim()}
          >
            <Shield size={16} className="mr-2" />
            {requestingDiscount ? "Aplicando..." : "Aplicar y Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountAuthModal;
