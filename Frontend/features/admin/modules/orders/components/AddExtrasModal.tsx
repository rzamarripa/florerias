"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import { Package, Save, X } from "lucide-react";
import { Storage, MaterialItem, Material } from "@/features/admin/modules/storage/types";
import MultiSelect, { SelectOption } from "@/components/forms/Multiselect";
import { toast } from "react-toastify";

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
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1 fw-bold">Agregar Extras</h5>
              <p className="text-muted mb-0 small">
                Selecciona materiales del almacén para agregar como extras
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleClose}
              className="text-muted p-0"
            >
              <X size={24} />
            </Button>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {materialOptions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Package size={48} className="mb-3 opacity-50" />
            <p className="mb-0">No hay materiales disponibles en el almacén</p>
            <small>Agrega materiales al almacén primero</small>
          </div>
        ) : (
          <>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                Materiales Disponibles
              </Form.Label>
              <MultiSelect
                value={selectedMaterialIds}
                options={materialOptions}
                onChange={setSelectedMaterialIds}
                placeholder="Selecciona materiales..."
                noOptionsMessage="No hay materiales disponibles"
                isSearchable={true}
              />
              <Form.Text className="text-muted">
                Solo se muestran materiales con stock disponible
              </Form.Text>
            </Form.Group>

            {selectedMaterials.length > 0 && (
              <div>
                <h6 className="mb-3 fw-semibold">Cantidades</h6>
                <div className="d-flex flex-column gap-3">
                  {selectedMaterials.map((option) => {
                    const quantity = materialQuantities[option.value] || 1;
                    const material = option.material;
                    const maxQuantity = option.availableQuantity || 0;

                    return (
                      <div
                        key={option.value}
                        className="d-flex align-items-center justify-content-between p-3 border rounded"
                      >
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{material.name}</div>
                          <div className="small text-muted">
                            Precio: ${material.price?.toFixed(2) || "0.00"} |
                            Disponible: {maxQuantity}
                          </div>
                        </div>
                        <div style={{ width: "120px" }}>
                          <Form.Control
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
                            size="sm"
                          />
                        </div>
                        <div className="text-end" style={{ width: "100px" }}>
                          <Badge bg="primary" pill>
                            ${(material.price * quantity).toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Total Extras:</span>
                    <span className="fs-5 fw-bold text-primary">
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
      </Modal.Body>

      <Modal.Footer className="border-0">
        <div className="d-flex gap-2 w-100 justify-content-end">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || selectedMaterialIds.length === 0}
            className="d-flex align-items-center gap-2"
          >
            <Save size={18} />
            Agregar Extras
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AddExtrasModal;
