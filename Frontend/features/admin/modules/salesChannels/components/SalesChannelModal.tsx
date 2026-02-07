"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { salesChannelsService } from "../services/salesChannels";
import { SalesChannel, CreateSalesChannelData, UpdateSalesChannelData } from "../types";
import { useUserSessionStore } from "@/stores/userSessionStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SalesChannelModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  salesChannel?: SalesChannel | null;
}

const SalesChannelModal: React.FC<SalesChannelModalProps> = ({
  show,
  onHide,
  onSuccess,
  salesChannel,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    abbreviation: "",
    status: "active" as "active" | "inactive",
  });

  const { user } = useUserSessionStore();
  const userRole = user?.role?.name;

  useEffect(() => {
    if (salesChannel) {
      setFormData({
        name: salesChannel.name,
        abbreviation: salesChannel.abbreviation,
        status: salesChannel.status,
      });
    } else {
      setFormData({
        name: "",
        abbreviation: "",
        status: "active",
      });
    }
  }, [salesChannel, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.abbreviation) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar longitud de abreviatura
    if (formData.abbreviation.length > 10) {
      toast.error("La abreviatura no puede tener más de 10 caracteres");
      return;
    }

    try {
      setLoading(true);

      if (salesChannel) {
        const updateData: UpdateSalesChannelData = {
          name: formData.name,
          abbreviation: formData.abbreviation.toUpperCase(),
          status: formData.status,
        };

        const response = await salesChannelsService.updateSalesChannel(
          salesChannel._id,
          updateData
        );

        if (response.success) {
          toast.success("Canal de venta actualizado exitosamente");
          onSuccess();
          onHide();
        }
      } else {
        const createData: CreateSalesChannelData = {
          name: formData.name,
          abbreviation: formData.abbreviation.toUpperCase(),
          status: formData.status,
        };

        const response = await salesChannelsService.createSalesChannel(createData);

        if (response.success) {
          toast.success("Canal de venta creado exitosamente");
          onSuccess();
          onHide();
        }
      }
    } catch (error: any) {
      console.error("Error al guardar canal de venta:", error);
      toast.error(
        error?.message || "Error al guardar el canal de venta. Por favor intenta de nuevo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {salesChannel ? "Editar Canal de Venta" : "Nuevo Canal de Venta"}
          </DialogTitle>
          <DialogDescription>
            {salesChannel
              ? "Actualiza la información del canal de venta"
              : "Completa los datos del nuevo canal de venta"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Canal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Venta Directa, E-commerce, WhatsApp, etc."
                required
              />
              <p className="text-sm text-muted-foreground">
                Nombre descriptivo del canal de venta
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Abreviatura */}
              <div className="space-y-2">
                <Label htmlFor="abbreviation">
                  Abreviatura <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="abbreviation"
                  type="text"
                  value={formData.abbreviation}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 10);
                    setFormData((prev) => ({ ...prev, abbreviation: value }));
                  }}
                  placeholder="Ej: VD, EC, WA"
                  maxLength={10}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Máximo 10 caracteres
                </p>
              </div>

              {/* Estatus */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Estatus <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Solo los canales activos estarán disponibles
                </p>
              </div>
            </div>

            {/* Información adicional para el usuario */}
            {userRole === "Gerente" && !salesChannel && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  Este canal de venta se asociará automáticamente a tu empresa.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onHide}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : salesChannel ? (
                "Actualizar Canal"
              ) : (
                "Crear Canal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalesChannelModal;