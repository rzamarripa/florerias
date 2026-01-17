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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-toastify";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { storageService } from "../services/storage";
import { branchesService } from "../../branches/services/branches";
import { Branch } from "../../branches/types";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface CreateStorageModalProps {
  show: boolean;
  onHide: () => void;
  onStorageSaved: () => void;
  branches?: Branch[];
}

const CreateStorageModal: React.FC<CreateStorageModalProps> = ({
  show,
  onHide,
  onStorageSaved,
  branches: propBranches,
}) => {
  const { activeBranch } = useActiveBranchStore();
  const { getIsAdmin, hasRole } = useUserRoleStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [storageName, setStorageName] = useState<string>("");
  const [storageExists, setStorageExists] = useState<boolean>(false);
  const [checkingStorage, setCheckingStorage] = useState<boolean>(false);

  const isAdmin = getIsAdmin();
  const isManager = hasRole("Gerente");
  const isCashier = hasRole("Cajero");

  useEffect(() => {
    if (show) {
      loadData();
      // Si hay una sucursal activa, establecerla automaticamente
      if (activeBranch?._id) {
        setSelectedBranch(activeBranch._id);
      }
    }
  }, [show, activeBranch]);

  // Verificar si existe almacen cuando se selecciona una sucursal (para Gerente/Cajero)
  useEffect(() => {
    if (show && (isManager || isCashier) && propBranches && propBranches.length > 0) {
      const userBranchId = propBranches[0]._id;
      checkIfStorageExists(userBranchId);
    }
  }, [show, isManager, isCashier, propBranches]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Solo cargar sucursales si es admin
      if (isAdmin) {
        if (!propBranches) {
          const branchesResponse = await branchesService.getAllBranches({
            limit: 100,
          });
          setBranches(branchesResponse.data);
        } else {
          setBranches(propBranches);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos");
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const checkIfStorageExists = async (branchId: string) => {
    try {
      setCheckingStorage(true);
      const response = await storageService.checkStorageExists(branchId);
      setStorageExists(response.exists);
    } catch (error: any) {
      console.error("Error checking storage:", error);
      setStorageExists(false);
    } finally {
      setCheckingStorage(false);
    }
  };

  const validateForm = (): boolean => {
    // Validar nombre del almacen
    if (!storageName || storageName.trim() === "") {
      toast.error("El nombre del almacen es requerido");
      return false;
    }

    // Validar sucursal solo para administradores
    if (isAdmin && !selectedBranch) {
      toast.error("Debes seleccionar una sucursal");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Preparar datos para enviar al backend
      const storageData: any = {
        name: storageName.trim(),
      };

      // Solo incluir branch si es admin
      if (isAdmin) {
        storageData.branch = selectedBranch;
      }

      await storageService.createStorage(storageData);

      toast.success("Almacen creado exitosamente");
      onStorageSaved();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al crear almacen");
      console.error("Error creating storage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBranch("");
    setStorageName("");
    setStorageExists(false);
    setCheckingStorage(false);
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-lg font-bold">Crear Nuevo Almacen</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loadingData ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando datos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Informacion del Almacen */}
              <div className="mb-4">
                <h6 className="mb-3 font-bold text-primary">
                  Informacion del Almacen
                </h6>

                {/* Nombre del Almacen */}
                <div className="mb-3">
                  <Label htmlFor="storageName">
                    Nombre del Almacen <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="storageName"
                    type="text"
                    placeholder="Ej: Almacen Principal"
                    value={storageName}
                    onChange={(e) => setStorageName(e.target.value)}
                    required
                  />
                  <p className="text-muted-foreground text-sm mt-1">
                    Ingresa un nombre descriptivo para el almacen
                  </p>
                </div>

                {/* Sucursal - Solo para Administradores */}
                {isAdmin && (
                  <div className="mb-3">
                    <Label htmlFor="branch">
                      Sucursal <span className="text-destructive">*</span>
                    </Label>
                    {activeBranch ? (
                      <>
                        <Input
                          type="text"
                          value={`${activeBranch.branchName} ${
                            activeBranch.branchCode
                              ? `(${activeBranch.branchCode})`
                              : ""
                          }`}
                          readOnly
                          className="bg-muted"
                        />
                        <p className="text-muted-foreground text-sm mt-1">
                          Sucursal seleccionada automaticamente
                        </p>
                      </>
                    ) : (
                      <Select
                        value={selectedBranch}
                        onValueChange={setSelectedBranch}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sucursal..." />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch._id} value={branch._id}>
                              {branch.branchName}{" "}
                              {branch.branchCode ? `(${branch.branchCode})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Mensaje informativo para Gerentes */}
                {isManager && !storageExists && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-sm">
                      El almacen se creara automaticamente para tu sucursal
                      asignada.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Mensaje informativo para Cajeros */}
                {isCashier && !storageExists && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-sm">
                      El almacen se creara automaticamente para tu sucursal
                      asignada.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alerta cuando ya existe almacen */}
                {(isManager || isCashier) && storageExists && (
                  <Alert variant="destructive" className="bg-yellow-50 border-yellow-300 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Atencion:</strong> Ya existe un almacen para tu sucursal.
                      Cada sucursal solo puede tener un almacen.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || loadingData || ((isManager || isCashier) && storageExists)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creando...
              </>
            ) : (
              "Crear Almacen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStorageModal;
