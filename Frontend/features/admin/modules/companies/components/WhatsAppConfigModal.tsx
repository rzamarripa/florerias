"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Company, WhatsAppVertical, UpsertWhatsappConfigData } from "../types";
import { companiesService } from "../services/companies";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WhatsAppConfigModalProps {
  show: boolean;
  onHide: () => void;
  company: Company;
  onCallback?: () => void;
}

const VERTICAL_OPTIONS: WhatsAppVertical[] = [
  "Retail",
  "Servicios",
  "Restaurantes",
  "Educacion",
  "Salud",
  "Tecnologia",
  "Otro",
];

const getDefaultFormData = (company: Company): UpsertWhatsappConfigData => ({
  legalName: company.legalName || "",
  website: "",
  businessCountry: "Mexico",
  businessAddress: "",
  vertical: "Retail",
  contactName: "",
  contactEmail: "",
  facebookAccount: "",
  phoneNumber: "",
  displayName: "",
});

const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  show,
  onHide,
  company,
  onCallback,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpsertWhatsappConfigData>(
    getDefaultFormData(company)
  );

  useEffect(() => {
    if (show) {
      loadExistingConfig();
    }
  }, [show]);

  const loadExistingConfig = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getWhatsappConfig(company._id);

      if (response.data) {
        setFormData({
          legalName: response.data.legalName || company.legalName || "",
          website: response.data.website || "",
          businessCountry: response.data.businessCountry || "Mexico",
          businessAddress: response.data.businessAddress || "",
          vertical: response.data.vertical || "Retail",
          contactName: response.data.contactName || "",
          contactEmail: response.data.contactEmail || "",
          facebookAccount: response.data.facebookAccount || "",
          phoneNumber: response.data.phoneNumber || "",
          displayName: response.data.displayName || "",
        });
      } else {
        setFormData(getDefaultFormData(company));
      }
    } catch (error: any) {
      console.error("Error al cargar configuración WhatsApp:", error);
      toast.error(
        error.message || "Error al cargar la configuración existente"
      );
      setFormData(getDefaultFormData(company));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof UpsertWhatsappConfigData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.legalName.trim()) {
      toast.error("La razón social es requerida");
      return;
    }
    if (!formData.businessCountry.trim()) {
      toast.error("El país del negocio es requerido");
      return;
    }
    if (!formData.businessAddress.trim()) {
      toast.error("La dirección del negocio es requerida");
      return;
    }
    if (!formData.contactName.trim()) {
      toast.error("El nombre del contacto es requerido");
      return;
    }
    if (!formData.contactEmail.trim()) {
      toast.error("El email del contacto es requerido");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("El número de teléfono es requerido");
      return;
    }
    if (!/^\+[1-9]\d{1,14}$/.test(formData.phoneNumber.trim())) {
      toast.error(
        "El número de teléfono debe tener formato E.164 (ej: +521234567890)"
      );
      return;
    }
    if (!formData.displayName.trim()) {
      toast.error("El nombre para mostrar es requerido");
      return;
    }

    try {
      setSaving(true);
      await companiesService.upsertWhatsappConfig(company._id, formData);
      toast.success("Configuración de WhatsApp guardada exitosamente");
      onCallback?.();
      onHide();
    } catch (error: any) {
      console.error("Error al guardar configuración WhatsApp:", error);
      toast.error(
        error.message || "Error al guardar la configuración de WhatsApp"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onHide();
    }
  };

  return (
    <Dialog
      open={show}
      onOpenChange={(open) => !saving && !open && handleClose()}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Configuración WhatsApp - {company.legalName}
          </DialogTitle>
          <DialogDescription>
            Registra o edita los datos de configuración de WhatsApp Business para
            esta empresa
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-3">
              Cargando configuración...
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-1">
                {/* Datos del Negocio */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">
                    Datos del Negocio
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="legalName">Razón Social *</Label>
                      <Input
                        id="legalName"
                        value={formData.legalName}
                        onChange={(e) =>
                          handleChange("legalName", e.target.value)
                        }
                        placeholder="Razón social del negocio"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="website">Sitio Web</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          handleChange("website", e.target.value)
                        }
                        placeholder="https://www.ejemplo.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="businessCountry">País *</Label>
                        <Input
                          id="businessCountry"
                          value={formData.businessCountry}
                          onChange={(e) =>
                            handleChange("businessCountry", e.target.value)
                          }
                          placeholder="País del negocio"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="vertical">Vertical *</Label>
                        <Select
                          value={formData.vertical}
                          onValueChange={(value) =>
                            handleChange("vertical", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una vertical" />
                          </SelectTrigger>
                          <SelectContent>
                            {VERTICAL_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="businessAddress">
                        Dirección del Negocio *
                      </Label>
                      <Input
                        id="businessAddress"
                        value={formData.businessAddress}
                        onChange={(e) =>
                          handleChange("businessAddress", e.target.value)
                        }
                        placeholder="Dirección completa del negocio"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Datos del Contacto */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">
                    Datos del Contacto
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="contactName">
                        Nombre del Contacto *
                      </Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) =>
                          handleChange("contactName", e.target.value)
                        }
                        placeholder="Nombre completo del contacto"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactEmail">
                        Email del Contacto *
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) =>
                          handleChange("contactEmail", e.target.value)
                        }
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="facebookAccount">
                        Cuenta de Facebook
                      </Label>
                      <Input
                        id="facebookAccount"
                        value={formData.facebookAccount}
                        onChange={(e) =>
                          handleChange("facebookAccount", e.target.value)
                        }
                        placeholder="URL o nombre de la cuenta de Facebook"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Datos de WhatsApp */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">
                    Datos de WhatsApp
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="phoneNumber">
                        Número de Teléfono (E.164) *
                      </Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          handleChange("phoneNumber", e.target.value)
                        }
                        placeholder="+521234567890"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="displayName">
                        Nombre para Mostrar *
                      </Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) =>
                          handleChange("displayName", e.target.value)
                        }
                        placeholder="Nombre que verán los clientes en WhatsApp"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppConfigModal;
