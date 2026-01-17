"use client";

import React, { useState, useEffect } from "react";
import { Save, UserPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Branch, CreateBranchData, Manager } from "../types";
import { branchesService } from "../services/branches";
import { companiesService } from "../../companies/services/companies";
import { useBranchModalStore } from "@/stores/branchModalStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Company {
  _id: string;
  legalName: string;
  rfc: string;
  isFranchise?: boolean;
}

interface BranchModalProps {
  show: boolean;
  onHide: () => void;
  branch?: Branch | null;
  onBranchSaved?: () => void;
  userCompany?: any;
}

const BranchModal: React.FC<BranchModalProps> = ({
  show,
  onHide,
  branch,
  onBranchSaved,
  userCompany,
}) => {
  const isEditing = !!branch;
  const { reopenBranchSelectionAfterCreate } = useBranchModalStore();
  const activeBranch = useActiveBranchStore((state) => state.activeBranch);

  const [formData, setFormData] = useState<CreateBranchData>({
    branchName: "",
    branchCode: "",
    rfc: "",
    companyId: "",
    address: {
      street: "",
      externalNumber: "",
      internalNumber: "",
      neighborhood: "",
      city: "",
      state: "",
      postalCode: "",
    },
    managerId: "",
    managerData: {
      username: "",
      email: "",
      phone: "",
      password: "",
      profile: {
        name: "",
        lastName: "",
      },
    },
    contactPhone: "",
    contactEmail: "",
    royaltiesPercentage: 0,
    advertisingBranchPercentage: 0,
    advertisingBrandPercentage: 0,
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersMessage, setManagersMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      loadCompanies();
      loadManagers();
      if (branch) {
        const managerId =
          branch.manager && typeof branch.manager !== "string"
            ? branch.manager._id
            : "";
        const manager =
          branch.manager && typeof branch.manager !== "string"
            ? branch.manager
            : null;

        setFormData({
          branchName: branch.branchName,
          branchCode: branch.branchCode || "",
          rfc: branch.rfc,
          companyId:
            typeof branch.companyId === "string"
              ? branch.companyId
              : branch.companyId._id,
          address: branch.address,
          managerId: managerId,
          managerData: manager
            ? {
                username: manager.username,
                email: manager.email,
                phone: manager.phone,
                password: "",
                profile: {
                  name: manager.profile.name,
                  lastName: manager.profile.lastName,
                },
              }
            : {
                username: "",
                email: "",
                phone: "",
                password: "",
                profile: {
                  name: "",
                  lastName: "",
                },
              },
          contactPhone: branch.contactPhone,
          contactEmail: branch.contactEmail,
          royaltiesPercentage: branch.royaltiesPercentage || 0,
          advertisingBranchPercentage: branch.advertisingBranchPercentage || 0,
          advertisingBrandPercentage: branch.advertisingBrandPercentage || 0,
        });
      } else {
        resetForm();
        if (userCompany?._id) {
          setFormData((prev) => ({
            ...prev,
            companyId: userCompany._id,
          }));
        }
      }
    }
  }, [show, branch, userCompany]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getAllCompanies({
        isActive: true,
        limit: 1000,
      });
      setCompanies(response.data || []);
    } catch (err: any) {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const response = await branchesService.getAvailableManagers();
      setManagers(response.data || []);

      if (response.message) {
        setManagersMessage(response.message);
      } else if (!response.data || response.data.length === 0) {
        setManagersMessage("No hay gerentes disponibles");
      } else {
        setManagersMessage("");
      }
    } catch (err: any) {
      setManagers([]);
      setManagersMessage("No se pudieron cargar los gerentes disponibles");
    }
  };

  const resetForm = () => {
    setFormData({
      branchName: "",
      branchCode: "",
      rfc: "",
      companyId: "",
      address: {
        street: "",
        externalNumber: "",
        internalNumber: "",
        neighborhood: "",
        city: "",
        state: "",
        postalCode: "",
      },
      managerId: "",
      managerData: {
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
      },
      contactPhone: "",
      contactEmail: "",
      royaltiesPercentage: 0,
      advertisingBranchPercentage: 0,
      advertisingBrandPercentage: 0,
    });
    setError(null);
  };

  const handleManagerChange = (value: string) => {
    if (value === "" || value === "none") {
      setFormData({
        ...formData,
        managerId: "",
        managerData: {
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
    } else {
      const manager = managers.find((m) => m._id === value);
      if (manager) {
        setFormData({
          ...formData,
          managerId: value,
          managerData: {
            username: manager.username,
            email: manager.email,
            phone: manager.phone,
            password: "",
            profile: {
              name: manager.profile.name,
              lastName: manager.profile.lastName,
            },
          },
        });
      }
    }
  };

  const handleClearManager = () => {
    setFormData({
      ...formData,
      managerId: "",
      managerData: {
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
  };

  const validateForm = (): boolean => {
    if (!formData.companyId || formData.companyId.trim() === "") {
      setError("No se ha seleccionado una empresa.");
      return false;
    }

    if (!formData.branchName || !formData.rfc || !formData.contactPhone || !formData.contactEmail) {
      setError("Por favor completa todos los campos requeridos de la sucursal");
      return false;
    }

    if (
      !formData.address.street ||
      !formData.address.externalNumber ||
      !formData.address.neighborhood ||
      !formData.address.city ||
      !formData.address.state ||
      !formData.address.postalCode
    ) {
      setError("Por favor completa todos los campos de la dirección");
      return false;
    }

    if (
      !formData.managerData?.username ||
      !formData.managerData?.email ||
      !formData.managerData?.phone ||
      !formData.managerData?.profile?.name ||
      !formData.managerData?.profile?.lastName
    ) {
      setError("Por favor completa todos los campos del gerente");
      return false;
    }

    if (!isEditing && !formData.managerId && !formData.managerData?.password) {
      setError("La contraseña es requerida para crear un nuevo gerente");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!validateForm()) {
        setSaving(false);
        return;
      }

      const dataToSend: CreateBranchData = {
        branchName: formData.branchName,
        branchCode: formData.branchCode || undefined,
        rfc: formData.rfc,
        companyId: formData.companyId,
        address: formData.address,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        royaltiesPercentage: formData.royaltiesPercentage,
        advertisingBranchPercentage: formData.advertisingBranchPercentage,
        advertisingBrandPercentage: formData.advertisingBrandPercentage,
      };

      if (formData.managerId) {
        dataToSend.managerId = formData.managerId;
      }

      if (!formData.managerId && formData.managerData) {
        dataToSend.managerData = formData.managerData;
      }

      let response;

      if (isEditing && branch) {
        response = await branchesService.updateBranch(branch._id, dataToSend);
      } else {
        response = await branchesService.createBranch(dataToSend);
      }

      if (!response.success) {
        const errorMsg = response.message || "Error al guardar la sucursal";
        setError(errorMsg);
        toast.error(errorMsg);
        setSaving(false);
        return;
      }

      toast.success(
        isEditing
          ? "Sucursal actualizada exitosamente"
          : "Sucursal creada exitosamente"
      );
      onBranchSaved?.();
      onHide();

      if (!isEditing && !activeBranch) {
        setTimeout(() => {
          reopenBranchSelectionAfterCreate();
        }, 300);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error al guardar la sucursal";
      setError(errorMessage);
      toast.error(errorMessage);
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
    <Dialog open={show} onOpenChange={(open) => !saving && !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Sucursal" : "Nueva Sucursal"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="font-semibold">Información Básica</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de la Sucursal <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Nombre de la sucursal"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      placeholder="Código (opcional)"
                      value={formData.branchCode}
                      onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RFC <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="RFC de la sucursal"
                      value={formData.rfc}
                      onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                      maxLength={13}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa <span className="text-destructive">*</span></Label>
                    <Input
                      value={userCompany?.tradeName || userCompany?.legalName || "Cargando..."}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-4">
                <h3 className="font-semibold">Dirección</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Calle <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Nombre de la calle"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Núm. Ext. <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="123"
                      value={formData.address.externalNumber}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, externalNumber: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Núm. Int.</Label>
                    <Input
                      placeholder="A"
                      value={formData.address.internalNumber}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, internalNumber: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Colonia <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Colonia"
                      value={formData.address.neighborhood}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, neighborhood: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Ciudad"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Estado"
                      value={formData.address.state}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>C.P. <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="12345"
                      maxLength={5}
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              {/* Usuario Gerente */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Usuario Gerente <span className="text-destructive">*</span></h3>
                  </div>
                  {formData.managerId && (
                    <Button variant="outline" size="sm" onClick={handleClearManager}>
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Seleccionar Gerente (Opcional)</Label>
                  <Select
                    value={formData.managerId || "none"}
                    onValueChange={handleManagerChange}
                    disabled={managers.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un gerente existente o cree uno nuevo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {managers.length === 0 && managersMessage
                          ? `-- ${managersMessage} --`
                          : "-- Seleccione un gerente existente o cree uno nuevo --"}
                      </SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager._id} value={manager._id}>
                          {manager.profile.fullName} ({manager.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Ingresa el nombre"
                      value={formData.managerData?.profile.name || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        managerData: formData.managerData ? {
                          ...formData.managerData,
                          profile: { ...formData.managerData.profile, name: e.target.value },
                        } : undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Ingresa el apellido"
                      value={formData.managerData?.profile.lastName || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        managerData: formData.managerData ? {
                          ...formData.managerData,
                          profile: { ...formData.managerData.profile, lastName: e.target.value },
                        } : undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono <span className="text-destructive">*</span></Label>
                    <Input
                      type="tel"
                      placeholder="Ingresa el teléfono"
                      value={formData.managerData?.phone || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        managerData: formData.managerData ? { ...formData.managerData, phone: e.target.value } : undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input
                      type="email"
                      placeholder="Ingresa el email"
                      value={formData.managerData?.email || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        managerData: formData.managerData ? { ...formData.managerData, email: e.target.value } : undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre de Usuario <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Ingresa el nombre de usuario"
                      value={formData.managerData?.username || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        managerData: formData.managerData ? { ...formData.managerData, username: e.target.value } : undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Contraseña {!formData.managerId && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      type="password"
                      placeholder={formData.managerId ? "Sin cambios" : "Ingresa la contraseña"}
                      value={formData.managerData?.password || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        managerData: formData.managerData ? { ...formData.managerData, password: e.target.value } : undefined,
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Contacto Principal */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contacto Principal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono <span className="text-destructive">*</span></Label>
                    <Input
                      type="tel"
                      placeholder="1234567890"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input
                      type="email"
                      placeholder="contacto@sucursal.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Porcentajes */}
              <div className="space-y-4">
                <h3 className="font-semibold">Configuración de Porcentajes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {userCompany?.isFranchise && (
                    <div className="space-y-2">
                      <Label>Porcentaje de Regalías (%) <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.royaltiesPercentage}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value >= 0 && value <= 100) {
                            setFormData({ ...formData, royaltiesPercentage: value });
                          }
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Publicidad de Sucursal (%) <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.advertisingBranchPercentage}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value >= 0 && value <= 100) {
                          setFormData({ ...formData, advertisingBranchPercentage: value });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Publicidad de Marca (%) <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.advertisingBrandPercentage}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value >= 0 && value <= 100) {
                          setFormData({ ...formData, advertisingBrandPercentage: value });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !formData.companyId}>
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
      </DialogContent>
    </Dialog>
  );
};

export default BranchModal;
