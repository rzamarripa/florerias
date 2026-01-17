"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { neighborhoodsService } from "../services/neighborhoods";
import { Neighborhood, CreateNeighborhoodData, UpdateNeighborhoodData } from "../types";
import { useActiveBranchStore, Branch } from "@/stores/activeBranchStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { branchesService } from "@/features/admin/modules/branches/services/branches";

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

interface NeighborhoodModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  neighborhood?: Neighborhood | null;
}

const NeighborhoodModal: React.FC<NeighborhoodModalProps> = ({
  show,
  onHide,
  onSuccess,
  neighborhood,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    priceDelivery: "",
    status: "active" as "active" | "inactive",
    branchId: "",
  });

  const { activeBranch } = useActiveBranchStore();
  const { user } = useUserSessionStore();
  const userRole = user?.role?.name;
  const isGerente = userRole === "Gerente";

  useEffect(() => {
    const loadBranches = async () => {
      if (!show || isGerente) return;

      try {
        setLoadingBranches(true);
        const response = await branchesService.getUserBranches();
        if (response.data) {
          setBranches(response.data);
        }
      } catch (error) {
        console.error("Error cargando sucursales:", error);
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, [show, isGerente]);

  useEffect(() => {
    if (neighborhood) {
      setFormData({
        name: neighborhood.name,
        priceDelivery: neighborhood.priceDelivery.toString(),
        status: neighborhood.status,
        branchId: neighborhood.branch?._id || "",
      });
    } else {
      const defaultBranchId = activeBranch?._id || (branches.length === 1 ? branches[0]._id : "");
      setFormData({
        name: "",
        priceDelivery: "",
        status: "active",
        branchId: defaultBranchId,
      });
    }
  }, [neighborhood, show, activeBranch, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.priceDelivery) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    let finalBranchId = formData.branchId;

    if (!neighborhood) {
      if (isGerente) {
        finalBranchId = "";
      } else if (!finalBranchId && activeBranch) {
        finalBranchId = activeBranch._id;
      } else if (!finalBranchId) {
        toast.error("Por favor selecciona una sucursal");
        return;
      }
    }

    const priceValue = parseFloat(formData.priceDelivery);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error("El precio de entrega debe ser un número mayor o igual a 0");
      return;
    }

    try {
      setLoading(true);

      if (neighborhood) {
        const updateData: UpdateNeighborhoodData = {
          name: formData.name,
          priceDelivery: priceValue,
          status: formData.status,
        };

        const response = await neighborhoodsService.updateNeighborhood(
          neighborhood._id,
          updateData
        );

        if (response.success) {
          toast.success("Colonia actualizada exitosamente");
          onSuccess();
          onHide();
        }
      } else {
        const createData: CreateNeighborhoodData = {
          name: formData.name,
          priceDelivery: priceValue,
          status: formData.status,
          branchId: finalBranchId,
        };

        const response = await neighborhoodsService.createNeighborhood(createData);

        if (response.success) {
          toast.success("Colonia creada exitosamente");
          onSuccess();
          onHide();
        }
      }
    } catch (error: any) {
      console.error("Error al guardar colonia:", error);
      toast.error(
        error?.message || "Error al guardar la colonia. Por favor intenta de nuevo"
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
            {neighborhood ? "Editar Colonia" : "Nueva Colonia"}
          </DialogTitle>
          <DialogDescription>
            {neighborhood
              ? "Actualiza la información de la colonia"
              : "Completa los datos de la nueva colonia"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Sucursal */}
            {!neighborhood && branches.length > 1 && !isGerente && (
              <div className="space-y-2">
                <Label htmlFor="branchId">
                  Sucursal <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}
                  disabled={loadingBranches}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBranches ? "Cargando sucursales..." : "Seleccionar sucursal..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre de la Colonia <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Centro, Jardines de la Paz, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Precio */}
              <div className="space-y-2">
                <Label htmlFor="priceDelivery">
                  Precio de Entrega <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="priceDelivery"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceDelivery}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priceDelivery: e.target.value }))}
                  placeholder="0.00"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Costo de entrega para esta colonia
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
                  Solo las colonias activas estarán disponibles
                </p>
              </div>
            </div>
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
              ) : neighborhood ? (
                "Actualizar Colonia"
              ) : (
                "Crear Colonia"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NeighborhoodModal;
