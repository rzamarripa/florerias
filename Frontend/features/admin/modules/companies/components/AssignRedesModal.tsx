import React, { useState, useEffect } from "react";
import { Users, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { companiesService } from "../services/companies";
import { Company, RedesUser } from "../types";

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
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignRedesModalProps {
  show: boolean;
  onHide: () => void;
  company: Company;
  onRedesUpdated?: () => void;
}

interface RedesUserFormData {
  redesId: string;
  redesData?: {
    username: string;
    email: string;
    phone: string;
    password: string;
    profile: {
      name: string;
      lastName: string;
    };
  };
}

const AssignRedesModal: React.FC<AssignRedesModalProps> = ({
  show,
  onHide,
  company,
  onRedesUpdated,
}) => {
  const [redesUsers, setRedesUsers] = useState<RedesUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState<RedesUserFormData>({
    redesId: "",
    redesData: {
      username: "",
      email: "",
      phone: "",
      password: "",
      profile: {
        name: "",
        lastName: "",
      },
    },
  });
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Cargar usuarios redes cuando se abre el modal
  useEffect(() => {
    if (show) {
      loadRedesUsers();
      // Cargar el usuario redes actual de la empresa (si existe)
      if (company.redes && company.redes.length > 0) {
        const redesUser = company.redes[0];
        setFormData({
          redesId: redesUser._id,
          redesData: {
            username: redesUser.username,
            email: redesUser.email,
            phone: redesUser.phone,
            password: "",
            profile: {
              name: redesUser.profile.name,
              lastName: redesUser.profile.lastName,
            },
          },
        });
      } else {
        setFormData({
          redesId: "",
          redesData: {
            username: "",
            email: "",
            phone: "",
            password: "",
            profile: {
              name: "",
              lastName: "",
            },
          },
        });
      }
      // Limpiar confirmación de contraseña
      setConfirmPassword("");
    }
  }, [show, company]);

  const loadRedesUsers = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getRedesUsers();
      setRedesUsers(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar usuarios redes:", error);
      toast.error(error.message || "Error al cargar usuarios redes");
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de usuario redes
  const handleRedesChange = (selectedId: string) => {
    if (selectedId === "" || selectedId === "new") {
      // Limpiar selección
      setFormData({
        redesId: "",
        redesData: {
          username: "",
          email: "",
          phone: "",
          password: "",
          profile: {
            name: "",
            lastName: "",
          },
        },
      });
      setConfirmPassword("");
    } else {
      // Usuario redes existente seleccionado - rellenar campos
      const redesUser = redesUsers.find((r) => r._id === selectedId);
      if (redesUser) {
        setFormData({
          redesId: selectedId,
          redesData: {
            username: redesUser.username,
            email: redesUser.email,
            phone: redesUser.phone,
            password: "",
            profile: {
              name: redesUser.profile.name,
              lastName: redesUser.profile.lastName,
            },
          },
        });
        setConfirmPassword("");
      }
    }
  };

  // Limpiar selección de usuario redes
  const handleClearRedes = () => {
    setFormData({
      redesId: "",
      redesData: {
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
      },
    });
    setConfirmPassword("");
  };

  // Validar formulario
  const validateForm = (): boolean => {
    // Validar datos del usuario redes
    if (
      !formData.redesData?.username ||
      !formData.redesData?.email ||
      !formData.redesData?.phone ||
      !formData.redesData?.profile?.name ||
      !formData.redesData?.profile?.lastName
    ) {
      toast.error("Por favor completa todos los campos del usuario redes");
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.redesData.email)) {
      toast.error("Por favor ingresa un email válido");
      return false;
    }

    // Validar contraseña solo si se está creando un nuevo usuario (sin redesId) o si se está actualizando
    if (!formData.redesId && !formData.redesData?.password) {
      toast.error("La contraseña es requerida para crear un nuevo usuario");
      return false;
    }

    // Validar que las contraseñas coincidan si se ingresó una contraseña
    if (formData.redesData?.password && formData.redesData.password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return false;
    }

    // Validar longitud mínima de contraseña
    if (formData.redesData?.password && formData.redesData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const dataToSend: any = {};

      // Si hay redesId, estamos editando un usuario existente
      if (formData.redesId) {
        dataToSend.redesIds = [formData.redesId];

        // Enviar redesData para actualizar todos los campos del usuario
        dataToSend.redesUserData = {
          username: formData.redesData?.username || "",
          email: formData.redesData?.email || "",
          phone: formData.redesData?.phone || "",
          password: formData.redesData?.password || "", // Vacío si no se cambia
          profile: {
            name: formData.redesData?.profile.name || "",
            lastName: formData.redesData?.profile.lastName || "",
          },
        };
      }
      // Si no hay redesId, enviar redesData para crear nuevo usuario
      else if (formData.redesData) {
        dataToSend.redesUserData = {
          username: formData.redesData.username,
          email: formData.redesData.email,
          phone: formData.redesData.phone,
          password: formData.redesData.password,
          profile: {
            name: formData.redesData.profile.name,
            lastName: formData.redesData.profile.lastName,
          },
        };
      }

      await companiesService.updateCompany(company._id, dataToSend);

      toast.success(
        formData.redesId
          ? "Usuario redes actualizado exitosamente"
          : "Usuario redes creado y asignado exitosamente"
      );

      onRedesUpdated?.();
      onHide();
    } catch (error: any) {
      console.error("Error al asignar usuario redes:", error);
      toast.error(error.message || "Error al asignar usuario redes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !saving && !open && onHide()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div>Asignar Usuario Redes</div>
              <div className="text-sm font-normal text-muted-foreground">
                {company.legalName}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Selecciona un usuario redes existente o crea uno nuevo
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando...</p>
            </div>
          ) : (
            <div className="grid gap-4 py-4 px-1">
              {/* Selector de Usuario Redes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">
                    Seleccionar Usuario Redes (Opcional)
                  </Label>
                  {formData.redesId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearRedes}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
                <Select
                  value={formData.redesId || "new"}
                  onValueChange={handleRedesChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Seleccione un usuario redes existente o cree uno nuevo --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      -- Crear nuevo usuario redes --
                    </SelectItem>
                    {redesUsers.map((redesUser) => (
                      <SelectItem key={redesUser._id} value={redesUser._id}>
                        {redesUser.profile.fullName} ({redesUser.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.redesId
                    ? "Usuario redes seleccionado. Edite los datos abajo y guarde los cambios."
                    : "Puede seleccionar un usuario redes existente o crear uno nuevo llenando los campos."}
                </p>
              </div>

              {/* Campos del Usuario Redes - Siempre habilitados */}
              <div className="grid grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ingresa el nombre"
                    value={formData.redesData?.profile.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redesData: formData.redesData
                          ? {
                              ...formData.redesData,
                              profile: {
                                ...formData.redesData.profile,
                                name: e.target.value,
                              },
                            }
                          : undefined,
                      })
                    }
                  />
                </div>

                {/* Apellido */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-semibold">Apellido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Ingresa el apellido"
                    value={formData.redesData?.profile.lastName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redesData: formData.redesData
                          ? {
                              ...formData.redesData,
                              profile: {
                                ...formData.redesData.profile,
                                lastName: e.target.value,
                              },
                            }
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ingresa el teléfono"
                    value={formData.redesData?.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redesData: formData.redesData
                          ? {
                              ...formData.redesData,
                              phone: e.target.value,
                            }
                          : undefined,
                      })
                    }
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ingresa el email"
                    value={formData.redesData?.email || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redesData: formData.redesData
                          ? {
                              ...formData.redesData,
                              email: e.target.value,
                            }
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Nombre de Usuario */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="font-semibold">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa el nombre de usuario"
                    value={formData.redesData?.username || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redesData: formData.redesData
                          ? {
                              ...formData.redesData,
                              username: e.target.value,
                            }
                          : undefined,
                      })
                    }
                  />
                </div>

                {/* Rol - Siempre Redes por defecto */}
                <div className="space-y-2">
                  <Label className="font-semibold">Rol</Label>
                  <Input
                    type="text"
                    value="Redes"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Los usuarios redes siempre tienen rol Redes
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={
                      formData.redesId
                        ? "●●●●●●●● (Sin cambios)"
                        : "Ingresa la contraseña"
                    }
                    value={formData.redesData?.password || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        redesData: formData.redesData
                          ? {
                              ...formData.redesData,
                              password: e.target.value,
                            }
                          : undefined,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.redesId
                      ? "Dejar en blanco para mantener la contraseña actual"
                      : "Requerida para crear nuevo usuario"}
                  </p>
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-semibold">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={
                      formData.redesId
                        ? "●●●●●●●● (Sin cambios)"
                        : "Confirma la contraseña"
                    }
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {formData.redesId && (
                    <p className="text-xs text-muted-foreground">
                      Solo si desea cambiar la contraseña
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onHide} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRedesModal;
