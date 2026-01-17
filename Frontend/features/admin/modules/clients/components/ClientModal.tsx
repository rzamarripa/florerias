"use client";

import React, { useState, useEffect } from "react";
import { X, Save, User, QrCode, Download, Loader2 } from "lucide-react";
import { Client, CreateClientData, UpdateClientData } from "../types";
import { useRouter } from "next/navigation";
import digitalCardService from "../../digitalCards/services/digitalCardService";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClientModalProps {
  show: boolean;
  onHide: () => void;
  client?: Client | null;
  onSave: (data: CreateClientData | UpdateClientData) => void;
  loading?: boolean;
}

const ClientModal: React.FC<ClientModalProps> = ({
  show,
  onHide,
  client,
  onSave,
  loading = false,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateClientData>({
    name: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    points: 0,
    status: true,
    branch: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatingCard, setGeneratingCard] = useState(false);
  const [digitalCard, setDigitalCard] = useState<any>(null);
  const [showCardActions, setShowCardActions] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        lastName: client.lastName,
        phoneNumber: client.phoneNumber,
        email: client.email || "",
        points: client.points,
        status: client.status,
        branch: client.branch?._id || "",
      });
      if (client._id) {
        checkDigitalCard(client._id);
      }
    } else {
      setFormData({
        name: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        points: 0,
        status: true,
        branch: "",
      });
      setDigitalCard(null);
      setShowCardActions(false);
    }
    setErrors({});
  }, [client, show]);

  const handleChange = (field: keyof CreateClientData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "El teléfono es requerido";
    }
    if (formData.points !== undefined && formData.points < 0) {
      newErrors.points = "Los puntos no pueden ser negativos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const isEditing = !!client;

  const checkDigitalCard = async (clientId: string) => {
    try {
      const card = await digitalCardService.getDigitalCard(clientId);
      if (card) {
        setDigitalCard(card);
        setShowCardActions(true);
      }
    } catch (error) {
      console.log("No hay tarjeta digital para este cliente");
    }
  };

  const handleGenerateCard = async () => {
    if (!client?._id) return;

    try {
      setGeneratingCard(true);
      let card = digitalCard;

      if (!card) {
        card = await digitalCardService.generateDigitalCard(client._id);
        toast.success("Tarjeta digital generada exitosamente");
      }

      setDigitalCard(card);
      setShowCardActions(true);
    } catch (error) {
      console.error("Error generando tarjeta:", error);
      toast.error("Error al generar la tarjeta digital");
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleDownloadQR = () => {
    if (digitalCard?.qrCode) {
      digitalCardService.downloadQRImage(
        digitalCard.qrCode,
        `qr-${client?.clientNumber || "cliente"}.png`
      );
      toast.success("Código QR descargado");
    }
  };

  const handleViewFullCard = () => {
    if (client?._id) {
      router.push(`/admin/digital-cards?clientId=${client._id}`);
      onHide();
    }
  };

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del cliente"
              : "Completa los datos para crear un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Apellido <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Ingresa el apellido"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  className={errors.phoneNumber ? "border-destructive" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Puntos Iniciales</Label>
                <Input
                  id="points"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.points}
                  onChange={(e) =>
                    handleChange("points", parseInt(e.target.value) || 0)
                  }
                  className={errors.points ? "border-destructive" : ""}
                />
                {errors.points && (
                  <p className="text-sm text-destructive">{errors.points}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => handleChange("status", checked)}
                />
                <Label htmlFor="status">Cliente Activo</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <div className="flex gap-2 mr-auto">
                {!digitalCard ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCard}
                    disabled={generatingCard}
                  >
                    {generatingCard ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generar Tarjeta
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadQR}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar QR
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleViewFullCard}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Ver Tarjeta
                    </Button>
                  </>
                )}
              </div>
            )}
            <div className="flex gap-2">
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Actualizar" : "Crear"} Cliente
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientModal;
