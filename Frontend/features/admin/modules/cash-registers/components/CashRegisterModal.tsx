"use client";

import React, { useState, useEffect } from "react";
import { Save, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { CashRegister, CreateCashRegisterData, Branch } from "../types";
import { cashRegistersService } from "../services/cashRegisters";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CashRegisterModalProps {
  show: boolean;
  onHide: () => void;
  cashRegister?: CashRegister | null;
  onCashRegisterSaved?: () => void;
  isSocialMediaBox?: boolean;
}

const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  show,
  onHide,
  cashRegister,
  onCashRegisterSaved,
  isSocialMediaBox = false,
}) => {
  const isEditing = !!cashRegister;
  const { getUserId } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const { role } = useUserRoleStore();
  const userId = getUserId();
  const isAdministrator = role?.toLowerCase() === "administrador";
  const isManager = role?.toLowerCase() === "gerente";

  // Para administradores: verificar si hay sucursal seleccionada
  // Para gerentes: siempre pueden crear porque se obtiene su sucursal del backend
  const canCreate =
    isManager ||
    !isAdministrator ||
    (isAdministrator && activeBranch) ||
    isEditing;

  const [formData, setFormData] = useState<CreateCashRegisterData>({
    name: "",
    branchId: "",
    cashierId: null,
    managerId: "",
    initialBalance: 0,
    isSocialMediaBox: false,
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [boxType, setBoxType] = useState<"normal" | "social">("normal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);
  const [managerName, setManagerName] = useState<string>("");

  useEffect(() => {
    if (show && userId) {
      loadEmployeesByRole();
      if (cashRegister) {
        // Cuando esta editando, extraer el nombre del gerente
        const managerInfo = typeof cashRegister.managerId === "object"
          ? cashRegister.managerId?.profile?.fullName || "No disponible"
          : "Cargando...";

        setManagerName(managerInfo);

        setFormData({
          name: cashRegister.name,
          branchId:
            typeof cashRegister.branchId === "string"
              ? cashRegister.branchId
              : cashRegister.branchId._id,
          cashierId: cashRegister.cashierId
            ? typeof cashRegister.cashierId === "string"
              ? cashRegister.cashierId
              : cashRegister.cashierId._id
            : null,
          managerId:
            typeof cashRegister.managerId === "string"
              ? cashRegister.managerId
              : cashRegister.managerId._id,
          initialBalance: cashRegister.initialBalance,
        });
      } else {
        resetForm();
        // Pre-seleccionar tipo de caja si viene del prop
        if (isSocialMediaBox) {
          setBoxType("social");
          setFormData((prev) => ({
            ...prev,
            isSocialMediaBox: true,
          }));
        }
        // Para administradores: pre-seleccionar activeBranch si existe
        if (isAdministrator && activeBranch) {
          setFormData((prev) => ({
            ...prev,
            branchId: activeBranch._id,
          }));
        }
      }
    }
  }, [show, cashRegister, userId, isAdministrator, isManager, activeBranch, isSocialMediaBox]);

  const loadEmployeesByRole = async () => {
    try {
      if (!userId) return;
      setLoading(true);

      let response;
      if (isManager) {
        // Para gerentes: obtener su sucursal desde el backend
        response = await cashRegistersService.getManagerBranch(userId);
      } else {
        // Para administradores: obtener todas sus sucursales
        response = await cashRegistersService.getCashiersAndManagersByAdmin(
          userId
        );
      }

      if (response.data) {
        setBranches(response.data.branches || []);

        // Si es gerente, pre-seleccionar su sucursal y obtener el gerente de la sucursal
        if (isManager && response.data.branches.length > 0 && !cashRegister) {
          const branch = response.data.branches[0];
          setManagerBranch(branch);

          // Obtener el managerId de la sucursal
          const managerId = typeof branch.manager === "string"
            ? branch.manager
            : branch.manager?._id || userId;

          const managerInfo = typeof branch.manager === "object"
            ? branch.manager?.profile?.fullName || "No disponible"
            : "Cargando...";

          setManagerName(managerInfo);
          setFormData((prev) => ({
            ...prev,
            branchId: branch._id,
            managerId: managerId,
          }));
        }

        // Si es administrador y hay sucursal activa, obtener el gerente de esa sucursal
        if (isAdministrator && activeBranch && !cashRegister) {
          const managerId = typeof activeBranch.manager === "string"
            ? activeBranch.manager
            : activeBranch.manager?._id || "";

          const managerInfo = typeof activeBranch.manager === "object"
            ? activeBranch.manager?.profile?.fullName || "No disponible"
            : "Cargando...";

          setManagerName(managerInfo);
          setFormData((prev) => ({
            ...prev,
            managerId: managerId,
          }));
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos");
      toast.error("Error al cargar los datos necesarios");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      branchId: "",
      cashierId: null,
      managerId: "",
      initialBalance: 0,
      isSocialMediaBox: false,
    });
    setBoxType("normal");
    setError(null);
    setManagerName("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    // Si es el campo initialBalance, convertir a numero
    if (name === "initialBalance") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Cuando se selecciona el tipo de caja
  const handleBoxTypeChange = (value: string) => {
    const type = value as "normal" | "social";
    setBoxType(type);
    setFormData((prev) => ({
      ...prev,
      isSocialMediaBox: type === "social",
    }));
  };

  const handleBranchChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      branchId: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar sucursal para administradores (los gerentes ya tienen su sucursal asignada)
    if (isAdministrator && !isEditing && !activeBranch) {
      toast.error(
        "Debes seleccionar una sucursal antes de crear una caja registradora"
      );
      return;
    }

    if (!formData.name || !formData.branchId || !formData.managerId) {
      setError("El nombre, sucursal y gerente son obligatorios");
      return;
    }

    try {
      setSaving(true);

      if (isEditing && cashRegister) {
        // Al editar, no enviar cashierId ni isSocialMediaBox para no modificarlo (inmutable)
        const { cashierId, isSocialMediaBox, ...updateData } = formData;
        await cashRegistersService.updateCashRegister(
          cashRegister._id,
          updateData
        );
        toast.success("Caja registradora actualizada exitosamente");
      } else {
        // Al crear, enviar los datos con isSocialMediaBox segun el tipo seleccionado
        // El cashierId siempre sera null, se asignara cuando se abra la caja
        await cashRegistersService.createCashRegister(formData);
        toast.success("Caja registradora creada exitosamente");
      }

      if (onCashRegisterSaved) {
        onCashRegisterSaved();
      }

      onHide();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al guardar la caja registradora");
      toast.error(err.message || "Error al guardar la caja registradora");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="font-bold">
            {isEditing ? "Editar Caja Registradora" : "Nueva Caja Registradora"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            {/* Alerta para administradores sin sucursal seleccionada */}
            {isAdministrator && !activeBranch && !isEditing && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTitle className="text-sm font-bold">
                  Sucursal requerida
                </AlertTitle>
                <AlertDescription className="text-sm">
                  Debes seleccionar una sucursal antes de crear una caja
                  registradora. Ve a tu perfil y selecciona una sucursal activa.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-3">Cargando datos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Nombre de la Caja */}
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Nombre de la Caja <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Caja 1, Caja Principal"
                    required
                    className="rounded-lg"
                  />
                </div>

                {/* Tipo de Caja - Solo en creacion */}
                {!isEditing && (
                  <div className="space-y-2">
                    <Label className="font-semibold">
                      Tipo de Caja <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={boxType}
                      onValueChange={handleBoxTypeChange}
                      disabled={isSocialMediaBox}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Seleccione tipo de caja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Caja Normal (Tienda)</SelectItem>
                        <SelectItem value="social">Caja Redes Sociales</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Este campo no puede modificarse despues de crear la caja
                    </p>
                  </div>
                )}

                {/* Mostrar tipo de caja cuando esta editando */}
                {isEditing && (
                  <Alert className={cashRegister?.isSocialMediaBox ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}>
                    <AlertDescription className="flex items-center">
                      <strong className="mr-2">Tipo de Caja:</strong>
                      {cashRegister?.isSocialMediaBox ? "Caja Redes Sociales" : "Caja Normal (Tienda)"}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Sucursal - Solo mostrar select para NO administradores/gerentes o cuando esta editando */}
                {!isAdministrator && !isManager && !isEditing && (
                  <div className="space-y-2">
                    <Label className="font-semibold">
                      Sucursal <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={handleBranchChange}
                      disabled={isEditing}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Seleccione una sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch._id} value={branch._id}>
                            {branch.branchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isEditing && (
                      <p className="text-sm text-muted-foreground">
                        La sucursal no puede modificarse al editar
                      </p>
                    )}
                  </div>
                )}

                {/* Mostrar nombre de sucursal seleccionada para administradores en modo creacion */}
                {isAdministrator && !isEditing && activeBranch && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="flex items-center">
                      <strong className="mr-2">Sucursal:</strong>
                      {activeBranch.branchName}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Mostrar nombre de sucursal para gerentes en modo creacion */}
                {isManager && !isEditing && managerBranch && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="flex items-center">
                      <strong className="mr-2">Sucursal:</strong>
                      {managerBranch.branchName}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Gerente - Campo de solo lectura */}
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Gerente <span className="text-red-500">*</span>
                  </Label>
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="flex items-center">
                      <strong className="mr-2">Gerente asignado:</strong>
                      {managerName || "Cargando..."}
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">
                    El gerente se obtiene automaticamente de la sucursal seleccionada
                  </p>
                </div>

                {/* Nota sobre el cajero - Solo para cajas normales */}
                {boxType === "normal" && !isEditing && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-sm">
                      <strong>Nota:</strong> El cajero se asignara automaticamente
                      cuando un usuario con rol "Cajero" abra la caja
                      registradora.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Nota para cajas de redes sociales */}
                {boxType === "social" && !isEditing && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-sm">
                      <strong>Importante:</strong> Esta caja solo podra ser abierta
                      y cerrada por usuarios con rol "Redes". El usuario de redes
                      se asignara automaticamente cuando abra la caja.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Saldo Inicial */}
                {!isEditing && (
                  <div className="space-y-2">
                    <Label className="font-semibold">
                      Saldo Inicial
                    </Label>
                    <Input
                      type="number"
                      name="initialBalance"
                      value={formData.initialBalance || 0}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      El saldo inicial con el que abre la caja (opcional, por
                      defecto 0)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="px-4 rounded-lg"
            >
              <X size={18} className="mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || loading || !canCreate}
              className="px-4 rounded-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  {isEditing ? "Actualizar" : "Crear"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterModal;
