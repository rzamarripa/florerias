"use client";

import React, { useState, useEffect } from "react";
import { Package, Save, X } from "lucide-react";
import { Storage, MaterialItem, Material } from "@/features/admin/modules/storage/types";
import MultiSelect, { SelectOption } from "@/components/forms/Multiselect";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AddExtrasModalProps {
  show: boolean;
  onHide: () => void;
  storage: Storage | null;
  onAddExtras: (extras: { materialId: string; name: string; price: number; quantity: number }[]) => void;
}

const AddExtrasModal: React.FC<AddExtrasModalProps> = ({
  show,
  onHide,
  storage,
  onAddExtras,
}) => {
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [materialQuantities, setMaterialQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setSelectedMaterialIds([]);
      setMaterialQuantities({});
    }
  }, [show]);

  const getMaterialOptions = (): SelectOption[] => {
    if (!storage || !storage.materials) return [];

    return storage.materials
      .filter((item) => item.quantity > 0) // Solo materiales con stock
      .map((item) => {
        const material = typeof item.materialId === "string"
          ? { _id: item.materialId, name: "Material", price: 0 }
          : item.materialId;

        const unitName = typeof material.unit === "string"
          ? material.unit
          : material.unit?.abbreviation || material.unit?.name || "";

        return {
          value: typeof item.materialId === "string" ? item.materialId : item.materialId._id,
          label: `${material.name} (${unitName}) - Stock: ${item.quantity}`,
          material: material,
          availableQuantity: item.quantity,
        };
      });
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    const option = getMaterialOptions().find((opt) => opt.value === materialId);
    if (!option) return;

    const maxQuantity = option.availableQuantity || 0;
    const validQuantity = Math.min(Math.max(1, quantity), maxQuantity);

    setMaterialQuantities((prev) => ({
      ...prev,
      [materialId]: validQuantity,
    }));
  };

  const handleSubmit = () => {
    if (selectedMaterialIds.length === 0) {
      toast.warning("Debes seleccionar al menos un material");
      return;
    }

    const options = getMaterialOptions();
    const extras = selectedMaterialIds.map((materialId) => {
      const option = options.find((opt) => opt.value === materialId);
      if (!option) return null;

      const quantity = materialQuantities[materialId] || 1;
      const material = option.material;

      return {
        materialId,
        name: material.name,
        price: material.price || 0,
        quantity,
      };
    }).filter((extra): extra is NonNullable<typeof extra> => extra !== null);

    if (extras.length === 0) {
      toast.error("Error al procesar los materiales seleccionados");
      return;
    }

    onAddExtras(extras);
    handleClose();
  };

  const handleClose = () => {
    setSelectedMaterialIds([]);
    setMaterialQuantities({});
    onHide();
  };

  const materialOptions = getMaterialOptions();
  const selectedMaterials = selectedMaterialIds
    .map((id) => materialOptions.find((opt) => opt.value === id))
    .filter((opt): opt is SelectOption => opt !== undefined);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="border-0 pb-0">
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="mb-1 font-bold">Agregar Extras</DialogTitle>
                <p className="text-muted-foreground mb-0 text-sm">
                  Selecciona materiales del almacen para agregar como extras
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-muted-foreground p-0 h-auto"
              >
                <X size={24} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {materialOptions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package size={48} className="mb-3 opacity-50 mx-auto" />
              <p className="mb-0">No hay materiales disponibles en el almacen</p>
              <small>Agrega materiales al almacen primero</small>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Label className="font-semibold mb-2 block">
                  Materiales Disponibles
                </Label>
                <MultiSelect
                  value={selectedMaterialIds}
                  options={materialOptions}
                  onChange={setSelectedMaterialIds}
                  placeholder="Selecciona materiales..."
                  noOptionsMessage="No hay materiales disponibles"
                  isSearchable={true}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Solo se muestran materiales con stock disponible
                </p>
              </div>

              {selectedMaterials.length > 0 && (
                <div>
                  <h6 className="mb-3 font-semibold">Cantidades</h6>
                  <div className="flex flex-col gap-3">
                    {selectedMaterials.map((option) => {
                      const quantity = materialQuantities[option.value] || 1;
                      const material = option.material;
                      const maxQuantity = option.availableQuantity || 0;

                      return (
                        <div
                          key={option.value}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div className="flex-grow">
                            <div className="font-semibold">{material.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Precio: ${material.price?.toFixed(2) || "0.00"} |
                              Disponible: {maxQuantity}
                            </div>
                          </div>
                          <div className="w-[120px]">
                            <Input
                              type="number"
                              min="1"
                              max={maxQuantity}
                              value={quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  option.value,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-8"
                            />
                          </div>
                          <div className="text-end w-[100px]">
                            <Badge variant="default" className="rounded-full">
                              ${(material.price * quantity).toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 p-3 bg-gray-100 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Extras:</span>
                      <span className="text-xl font-bold text-blue-600">
                        $
                        {selectedMaterials
                          .reduce((total, option) => {
                            const quantity = materialQuantities[option.value] || 1;
                            const price = option.material.price || 0;
                            return total + price * quantity;
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-0">
          <div className="flex gap-2 w-full justify-end">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedMaterialIds.length === 0}
              className="flex items-center gap-2"
            >
              <Save size={18} />
              Agregar Extras
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExtrasModal;
