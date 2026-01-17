import React, { useState, useEffect } from "react";
import { Save, Users, Eye, EyeOff, Loader2 } from "lucide-react";
import { Manager, CreateManagerData, UpdateManagerData } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ManagerModalProps {
  show: boolean;
  onHide: () => void;
  manager?: Manager | null;
  onSave: (data: CreateManagerData | UpdateManagerData) => void;
  loading?: boolean;
}

const ManagerModal: React.FC<ManagerModalProps> = ({
  show,
  onHide,
  manager,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateManagerData>({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    direccion: "",
    telefono: "",
    correo: "",
    usuario: "",
    contrasena: "",
    foto: "",
    estatus: true,
    branchId: "", // Se establecerá en el componente padre
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (manager) {
      setFormData({
        nombre: manager.nombre,
        apellidoPaterno: manager.apellidoPaterno,
        apellidoMaterno: manager.apellidoMaterno,
        direccion: manager.direccion,
        telefono: manager.telefono,
        correo: manager.correo,
        usuario: manager.usuario,
        contrasena: "",
        foto: manager.foto || "",
        estatus: manager.estatus,
        branchId: "", // No se necesita en actualización
      });
    } else {
      setFormData({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        direccion: "",
        telefono: "",
        correo: "",
        usuario: "",
        contrasena: "",
        foto: "",
        estatus: true,
        branchId: "", // Se establecerá en el componente padre
      });
    }
    setErrors({});
  }, [manager, show]);

  const handleChange = (field: keyof CreateManagerData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = "El apellido paterno es requerido";
    }
    if (!formData.apellidoMaterno.trim()) {
      newErrors.apellidoMaterno = "El apellido materno es requerido";
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es requerida";
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }
    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = "El correo no es válido";
    }
    if (!formData.usuario.trim()) {
      newErrors.usuario = "El usuario es requerido";
    }
    if (!manager && !formData.contrasena.trim()) {
      newErrors.contrasena = "La contraseña es requerida";
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

  const isEditing = !!manager;

  return (
    <Dialog open={show} onOpenChange={(open) => !loading && !open && onHide()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Gerente" : "Nuevo Gerente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza la información del gerente"
              : "Completa los datos del nuevo gerente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={formData.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">{errors.nombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidoPaterno">
                  Apellido Paterno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellidoPaterno"
                  type="text"
                  placeholder="Ingresa el apellido paterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => handleChange("apellidoPaterno", e.target.value)}
                />
                {errors.apellidoPaterno && (
                  <p className="text-sm text-destructive">{errors.apellidoPaterno}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidoMaterno">
                  Apellido Materno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellidoMaterno"
                  type="text"
                  placeholder="Ingresa el apellido materno"
                  value={formData.apellidoMaterno}
                  onChange={(e) => handleChange("apellidoMaterno", e.target.value)}
                />
                {errors.apellidoMaterno && (
                  <p className="text-sm text-destructive">{errors.apellidoMaterno}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="direccion"
                type="text"
                placeholder="Ingresa la dirección completa"
                value={formData.direccion}
                onChange={(e) => handleChange("direccion", e.target.value)}
              />
              {errors.direccion && (
                <p className="text-sm text-destructive">{errors.direccion}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                />
                {errors.telefono && (
                  <p className="text-sm text-destructive">{errors.telefono}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="correo">
                  Correo Electrónico <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="Ingresa el correo electrónico"
                  value={formData.correo}
                  onChange={(e) => handleChange("correo", e.target.value)}
                />
                {errors.correo && (
                  <p className="text-sm text-destructive">{errors.correo}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">
                  Usuario <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Ingresa el nombre de usuario"
                  value={formData.usuario}
                  onChange={(e) => handleChange("usuario", e.target.value)}
                />
                {errors.usuario && (
                  <p className="text-sm text-destructive">{errors.usuario}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contrasena">
                  Contraseña {!isEditing && <span className="text-destructive">*</span>}
                  {isEditing && (
                    <span className="text-muted-foreground text-xs ml-1">
                      (Dejar vacío para mantener actual)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="contrasena"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa la contraseña"
                    value={formData.contrasena}
                    onChange={(e) => handleChange("contrasena", e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.contrasena && (
                  <p className="text-sm text-destructive">{errors.contrasena}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foto">Foto</Label>
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleChange("foto", file.name);
                  }
                }}
              />
              {formData.foto && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {formData.foto}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="estatus"
                checked={formData.estatus}
                onCheckedChange={(checked) => handleChange("estatus", checked)}
              />
              <Label htmlFor="estatus" className="cursor-pointer">
                Activo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onHide} disabled={loading}>
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
                  {isEditing ? "Actualizar" : "Crear"} Gerente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManagerModal;