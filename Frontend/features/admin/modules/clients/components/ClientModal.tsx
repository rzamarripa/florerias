"use client";

import React, { useState, useEffect } from "react";
import { X, Save, User, QrCode, Download, Loader2, CreditCard, Eye, EyeOff } from "lucide-react";
import { Client, CreateClientData, UpdateClientData, HowDidYouHearAboutUs } from "../types";
import { useRouter } from "next/navigation";
import digitalCardService from "../../digitalCards/services/digitalCardService";
import { toast } from "sonner";
import { uploadDigitalCardQR } from "@/services/firebaseStorage";
import { branchesService } from "../../branches/services/branches";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientModalProps {
  show: boolean;
  onHide: () => void;
  client?: Client | null;
  onSave: (data: CreateClientData | UpdateClientData, generateCard?: boolean) => Promise<void>;
  loading?: boolean;
  companyId?: string | null;
}

const ClientModal: React.FC<ClientModalProps> = ({
  show,
  onHide,
  client,
  onSave,
  loading = false,
  companyId,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateClientData>({
    name: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    gender: "masculino",
    points: 0,
    status: true,
    company: "",
    howDidYouHearAboutUs: null,
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [digitalCard, setDigitalCard] = useState<any>(null);
  const [showCardActions, setShowCardActions] = useState(false);
  const [showCardConfirmation, setShowCardConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CreateClientData | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        lastName: client.lastName,
        phoneNumber: client.phoneNumber,
        email: client.email || "",
        gender: client.gender || "masculino",
        points: client.points,
        status: client.status,
        company: client.company || "",
        howDidYouHearAboutUs: client.howDidYouHearAboutUs || null,
        password: "",
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
        gender: "masculino",
        points: 0,
        status: true,
        company: "",
        howDidYouHearAboutUs: null,
        password: "",
      });
      setDigitalCard(null);
      setShowCardActions(false);
    }
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
    if (!formData.gender) {
      newErrors.gender = "El género es requerido";
    }
    if (formData.points !== undefined && formData.points < 0) {
      newErrors.points = "Los puntos no pueden ser negativos";
    }

    // Validación de contraseña
    if (!client) {
      // Creación: contraseña obligatoria
      if (!formData.password || !formData.password.trim()) {
        newErrors.password = "La contraseña es requerida";
      } else if (formData.password.length < 6) {
        newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      }
      if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    } else {
      // Edición: solo validar si se ingresó algo
      if (formData.password && formData.password.trim()) {
        if (formData.password.length < 6) {
          newErrors.password = "La contraseña debe tener al menos 6 caracteres";
        }
        if (formData.password !== confirmPassword) {
          newErrors.confirmPassword = "Las contraseñas no coinciden";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (!client) {
        // Para cliente nuevo, mostrar confirmación de tarjeta digital
        setPendingFormData(formData);
        setShowCardConfirmation(true);
      } else {
        // Para edición, excluir password si está vacío
        const { password, ...rest } = formData;
        const editData = password && password.trim() ? { ...rest, password } : rest;
        await onSave(editData);
      }
    }
  };

  const handleConfirmWithCard = async () => {
    if (pendingFormData) {
      setShowCardConfirmation(false);
      await onSave(pendingFormData, true);
      setPendingFormData(null);
    }
  };

  const handleConfirmWithoutCard = async () => {
    if (pendingFormData) {
      setShowCardConfirmation(false);
      await onSave(pendingFormData, false);
      setPendingFormData(null);
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
                <Label htmlFor="gender">
                  Género <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: 'masculino' | 'femenino' | 'otro') => handleChange("gender", value)}
                >
                  <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona el género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender}</p>
                )}
              </div>

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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña {!isEditing && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isEditing ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                    value={formData.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Contraseña {!isEditing && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="howDidYouHearAboutUs">¿Cómo se enteró de nosotros?</Label>
              <Select
                value={formData.howDidYouHearAboutUs || "no_especificado"}
                onValueChange={(value) => handleChange("howDidYouHearAboutUs", value === "no_especificado" ? null : value as HowDidYouHearAboutUs)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_especificado">Sin especificar</SelectItem>
                  <SelectItem value="redes_sociales">Redes Sociales (Facebook, Instagram, etc.)</SelectItem>
                  <SelectItem value="recomendacion">Recomendación de amigo/familiar</SelectItem>
                  <SelectItem value="google_busqueda">Google/Búsqueda en internet</SelectItem>
                  <SelectItem value="pasando_por_local">Pasando por el local</SelectItem>
                  <SelectItem value="volante_publicidad">Volante/Publicidad impresa</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => handleChange("status", checked)}
              />
              <Label htmlFor="status">Cliente Activo</Label>
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

      {/* Modal de confirmación para generar tarjeta digital */}
      <AlertDialog open={showCardConfirmation} onOpenChange={setShowCardConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              ¿Generar Tarjeta Digital?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">El cliente ha sido creado exitosamente.</span>
              <span className="block font-medium">¿Desea generar una tarjeta digital con código QR para este cliente?</span>
              <span className="block text-sm text-muted-foreground">
                La tarjeta digital permite al cliente acumular y canjear puntos escaneando su código QR.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmWithoutCard}>
              No, solo crear cliente
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWithCard} className="bg-primary">
              <CreditCard className="h-4 w-4 mr-2" />
              Sí, generar tarjeta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ClientModal;
