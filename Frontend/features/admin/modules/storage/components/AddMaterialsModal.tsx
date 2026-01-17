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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { X, Package, Save, Loader2 } from "lucide-react";
import { storageService } from "../services/storage";
import { materialsService } from "../../materials/services/materials";
import { Storage, Material } from "../types";

interface AddMaterialsModalProps {
  show: boolean;
  onHide: () => void;
  onMaterialsAdded: () => void;
  storage: Storage | null;
}

interface MaterialWithQuantity extends Material {
  quantityToAdd: number;
}

const AddMaterialsModal: React.FC<AddMaterialsModalProps> = ({
  show,
  onHide,
  onMaterialsAdded,
  storage,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    MaterialWithQuantity[]
  >([]);

  useEffect(() => {
    if (show && storage) {
      loadMaterials();
    }
  }, [show, storage]);

  const loadMaterials = async () => {
    try {
      setLoadingData(true);
      const response = await materialsService.getAllMaterials({
        limit: 1000,
        status: true,
      });

      // Filtrar materiales que NO estan en el almacen
      const storageMaterialIds =
        storage?.materials.map((m) =>
          typeof m.materialId === "string" ? m.materialId : m.materialId._id
        ) || [];

      const available = response.data.filter(
        (material) => !storageMaterialIds.includes(material._id)
      );

      setAvailableMaterials(available);
      setSelectedMaterials([]);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar materiales");
      console.error("Error loading materials:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleMaterialSelect = (materialId: string) => {
    if (!materialId || materialId === "placeholder") return;

    const material = availableMaterials.find((m) => m._id === materialId);
    if (!material) return;

    // Verificar que el material no este ya seleccionado
    if (selectedMaterials.some((m) => m._id === materialId)) {
      toast.warning("Este material ya esta en la lista");
      return;
    }

    // Agregar el material a la lista de seleccionados
    setSelectedMaterials([
      ...selectedMaterials,
      { ...material, quantityToAdd: 1 },
    ]);
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    setSelectedMaterials(
      selectedMaterials.map((m) =>
        m._id === materialId ? { ...m, quantityToAdd: Math.max(0, quantity) } : m
      )
    );
  };

  const handleRemoveMaterial = (materialId: string) => {
    setSelectedMaterials(selectedMaterials.filter((m) => m._id !== materialId));
  };

  const handleSubmit = async () => {
    try {
      if (!storage) {
        toast.error("No hay almacen seleccionado");
        return;
      }

      // Filtrar materiales con cantidad mayor a 0
      const validMaterials = selectedMaterials.filter((m) => m.quantityToAdd > 0);

      if (validMaterials.length === 0) {
        toast.error(
          "Debes agregar al menos un material con cantidad mayor a 0"
        );
        return;
      }

      setLoading(true);

      await storageService.addMaterialsToStorage(storage._id, {
        materials: validMaterials.map((m) => ({
          materialId: m._id,
          quantity: m.quantityToAdd,
        })),
      });

      toast.success("Materiales agregados exitosamente");
      onMaterialsAdded();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al agregar materiales");
      console.error("Error adding materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMaterials([]);
    onHide();
  };

  const getUnitName = (material: Material): string => {
    if (typeof material.unit === "string") {
      return material.unit;
    }
    return material.unit?.abbreviation || material.unit?.name || "N/A";
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <div>
            <DialogTitle className="text-lg font-bold">Agregar Materiales al Almacen</DialogTitle>
            {storage && (
              <p className="text-muted-foreground mb-0 text-sm">
                {typeof storage.branch === "string"
                  ? storage.branch
                  : storage.branch.branchName}
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="py-4">
          {loadingData ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando materiales...</p>
            </div>
          ) : (
            <>
              {/* Select para agregar materiales */}
              <div className="mb-4">
                <Label className="font-semibold mb-2 block">
                  Seleccionar Material
                </Label>
                <Select
                  onValueChange={handleMaterialSelect}
                  disabled={availableMaterials.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      availableMaterials.length === 0
                        ? "No hay materiales disponibles"
                        : "Seleccionar un material para agregar..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMaterials.map((material) => (
                      <SelectItem key={material._id} value={material._id}>
                        {material.name} ({getUnitName(material)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm mt-1">
                  {availableMaterials.length === 0
                    ? "Todos los materiales ya estan en el almacen"
                    : `${availableMaterials.length} material(es) disponible(s)`}
                </p>
              </div>

              {/* Tabla de materiales seleccionados */}
              <div>
                <h6 className="mb-3 font-semibold">Materiales a Agregar</h6>
                {selectedMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package size={48} className="mb-3 opacity-50 mx-auto" />
                    <p className="mb-0">No hay materiales seleccionados</p>
                    <small>Selecciona materiales del menu de arriba</small>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground">
                            MATERIAL
                          </TableHead>
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground">
                            UNIDAD
                          </TableHead>
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground w-[150px]">
                            CANTIDAD
                          </TableHead>
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-center w-[80px]">
                            ACCION
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMaterials.map((material) => (
                          <TableRow key={material._id}>
                            <TableCell className="px-3 py-2 font-semibold">
                              {material.name}
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <Badge variant="secondary">{getUnitName(material)}</Badge>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                value={material.quantityToAdd}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    material._id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell className="px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMaterial(material._id)}
                                className="text-destructive hover:text-destructive p-0 h-auto"
                              >
                                <X size={18} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || loadingData || selectedMaterials.length === 0}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Materiales
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaterialsModal;
