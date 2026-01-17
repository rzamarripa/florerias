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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Sale } from "../types";
import { salesService } from "../services/sales";

interface EditSaleModalProps {
  show: boolean;
  onHide: () => void;
  sale: Sale;
  onSaleUpdated: () => void;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({
  show,
  onHide,
  sale,
  onSaleUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryMessage: "",
    deliveryDateTime: "",
  });

  // Inicializar datos del formulario cuando se abre el modal
  useEffect(() => {
    if (show && sale) {
      const deliveryDate = sale.deliveryData?.deliveryDateTime
        ? new Date(sale.deliveryData.deliveryDateTime).toISOString().slice(0, 16)
        : "";

      setFormData({
        deliveryMessage: sale.deliveryData?.message || "",
        deliveryDateTime: deliveryDate,
      });
    }
  }, [show, sale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.deliveryDateTime) {
      toast.error("La fecha de entrega es obligatoria");
      return;
    }

    try {
      setLoading(true);

      await salesService.updateSaleDeliveryInfo(sale._id, {
        message: formData.deliveryMessage,
        deliveryDateTime: formData.deliveryDateTime,
      });

      toast.success("Informacion de entrega actualizada exitosamente");
      onSaleUpdated();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la venta");
      console.error("Error updating sale:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold">
            Editar Venta - {sale.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <h6 className="font-semibold mb-2">Informacion del Cliente</h6>
              <p className="mb-1">
                <strong>Cliente:</strong> {sale.clientInfo?.name || "N/A"}
              </p>
              {sale.clientInfo?.phone && (
                <p className="mb-1">
                  <strong>Telefono:</strong> {sale.clientInfo.phone}
                </p>
              )}
              <p className="mb-0">
                <strong>Total:</strong> ${sale.total.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDateTime" className="font-semibold">
                Fecha y Hora de Entrega <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deliveryDateTime"
                type="datetime-local"
                value={formData.deliveryDateTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryDateTime: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Actualiza la fecha y hora de entrega del pedido
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryMessage" className="font-semibold">
                Comentarios / Mensaje de Entrega
              </Label>
              <Textarea
                id="deliveryMessage"
                rows={4}
                value={formData.deliveryMessage}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryMessage: e.target.value })
                }
                placeholder="Escribe instrucciones especiales, comentarios sobre la entrega, etc."
              />
              <p className="text-xs text-muted-foreground">
                Instrucciones especiales o comentarios para la entrega
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onHide}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSaleModal;
