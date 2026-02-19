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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Truck } from "lucide-react";
import { toast } from "react-toastify";
import { Sale } from "../types";
import { salesService } from "../services/sales";
import { Neighborhood } from "@/features/admin/modules/neighborhoods/types";
import { neighborhoodsService } from "@/features/admin/modules/neighborhoods/services/neighborhoods";

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
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [formData, setFormData] = useState({
    deliveryMessage: "",
    deliveryDateTime: "",
    recipientName: "",
    street: "",
    neighborhood: "",
    reference: "",
  });

  // Check if delivery fields should be shown
  const showDeliveryFields = sale?.shippingType === 'envio' || sale?.stage?.boardType === 'Envio';

  // Load neighborhoods
  const fetchNeighborhoods = async () => {
    setLoadingNeighborhoods(true);
    try {
      const response = await neighborhoodsService.getAllNeighborhoods({
        limit: 1000,
        status: "active",
      });
      setNeighborhoods(response.data);
    } catch (err) {
      console.error("Error al cargar colonias:", err);
      toast.error("Error al cargar las colonias");
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  // Inicializar datos del formulario cuando se abre el modal
  useEffect(() => {
    if (show && sale) {
      const deliveryDate = sale.deliveryData?.deliveryDateTime
        ? new Date(sale.deliveryData.deliveryDateTime).toISOString().slice(0, 16)
        : "";

      setFormData({
        deliveryMessage: sale.deliveryData?.message || "",
        deliveryDateTime: deliveryDate,
        recipientName: sale.deliveryData?.recipientName || "",
        street: sale.deliveryData?.street || "",
        neighborhood: sale.deliveryData?.neighborhood || "",
        reference: sale.deliveryData?.reference || "",
      });

      // Load neighborhoods if showing delivery fields
      if (showDeliveryFields) {
        fetchNeighborhoods();
      }
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

      const updateData: any = {
        message: formData.deliveryMessage,
        deliveryDateTime: formData.deliveryDateTime,
      };

      // Include delivery address fields if showing delivery section
      if (showDeliveryFields) {
        if (formData.recipientName) updateData.recipientName = formData.recipientName;
        if (formData.street) updateData.street = formData.street;
        if (formData.neighborhood) updateData.neighborhood = formData.neighborhood;
        if (formData.reference) updateData.reference = formData.reference;
      }

      await salesService.updateSaleDeliveryInfo(sale._id, updateData);

      toast.success("Información de entrega actualizada exitosamente");
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

            {/* Delivery Address Section - Only show for shipping orders */}
            {showDeliveryFields && (
              <>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h6 className="font-semibold text-blue-600">Direccion de Entrega</h6>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientName" className="font-semibold">
                        Entregar a:
                      </Label>
                      <Input
                        id="recipientName"
                        type="text"
                        value={formData.recipientName}
                        onChange={(e) =>
                          setFormData({ ...formData, recipientName: e.target.value })
                        }
                        placeholder="Nombre del destinatario"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="street" className="font-semibold">
                          Calle y Numero
                        </Label>
                        <Input
                          id="street"
                          type="text"
                          value={formData.street}
                          onChange={(e) =>
                            setFormData({ ...formData, street: e.target.value })
                          }
                          placeholder="Ej: Av. Principal #123"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-semibold">
                          Colonia
                        </Label>
                        <Select
                          value={formData.neighborhood}
                          onValueChange={(value) =>
                            setFormData({ ...formData, neighborhood: value })
                          }
                          disabled={loadingNeighborhoods}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar colonia..." />
                          </SelectTrigger>
                          <SelectContent>
                            {neighborhoods.map((neighborhood) => (
                              <SelectItem key={neighborhood._id} value={neighborhood.name}>
                                {neighborhood.name} - ${neighborhood.priceDelivery.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference" className="font-semibold">
                        Senas o Referencias
                      </Label>
                      <Textarea
                        id="reference"
                        rows={2}
                        value={formData.reference}
                        onChange={(e) =>
                          setFormData({ ...formData, reference: e.target.value })
                        }
                        placeholder="Ej: Casa blanca con porton negro, frente al parque..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
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
