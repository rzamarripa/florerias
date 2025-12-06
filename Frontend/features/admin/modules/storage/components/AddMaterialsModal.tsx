"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { X, Package, Save } from "lucide-react";
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

      // Filtrar materiales que NO están en el almacén
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

  const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    if (!materialId) return;

    const material = availableMaterials.find((m) => m._id === materialId);
    if (!material) return;

    // Verificar que el material no esté ya seleccionado
    if (selectedMaterials.some((m) => m._id === materialId)) {
      toast.warning("Este material ya está en la lista");
      return;
    }

    // Agregar el material a la lista de seleccionados
    setSelectedMaterials([
      ...selectedMaterials,
      { ...material, quantityToAdd: 1 },
    ]);

    // Resetear el select
    e.target.value = "";
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
        toast.error("No hay almacén seleccionado");
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
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1 fw-bold">Agregar Materiales al Almacén</h5>
              {storage && (
                <p className="text-muted mb-0 small">
                  {typeof storage.branch === "string"
                    ? storage.branch
                    : storage.branch.branchName}
                </p>
              )}
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
        {loadingData ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Cargando materiales...</p>
          </div>
        ) : (
          <>
            {/* Select para agregar materiales */}
            <div className="mb-4">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Seleccionar Material
                </Form.Label>
                <Form.Select
                  onChange={handleMaterialSelect}
                  disabled={availableMaterials.length === 0}
                >
                  <option value="">
                    {availableMaterials.length === 0
                      ? "No hay materiales disponibles"
                      : "Seleccionar un material para agregar..."}
                  </option>
                  {availableMaterials.map((material) => (
                    <option key={material._id} value={material._id}>
                      {material.name} ({getUnitName(material)})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  {availableMaterials.length === 0
                    ? "Todos los materiales ya están en el almacén"
                    : `${availableMaterials.length} material(es) disponible(s)`}
                </Form.Text>
              </Form.Group>
            </div>

            {/* Tabla de materiales seleccionados */}
            <div>
              <h6 className="mb-3 fw-semibold">Materiales a Agregar</h6>
              {selectedMaterials.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <Package size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">No hay materiales seleccionados</p>
                  <small>Selecciona materiales del menú de arriba</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr>
                        <th className="px-3 py-2 fw-semibold text-muted">
                          MATERIAL
                        </th>
                        <th className="px-3 py-2 fw-semibold text-muted">
                          UNIDAD
                        </th>
                        <th
                          className="px-3 py-2 fw-semibold text-muted"
                          style={{ width: "150px" }}
                        >
                          CANTIDAD
                        </th>
                        <th
                          className="px-3 py-2 fw-semibold text-muted text-center"
                          style={{ width: "80px" }}
                        >
                          ACCIÓN
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMaterials.map((material) => (
                        <tr key={material._id}>
                          <td className="px-3 py-2 fw-semibold">
                            {material.name}
                          </td>
                          <td className="px-3 py-2">
                            <Badge bg="secondary">{getUnitName(material)}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Form.Control
                              type="number"
                              min="0"
                              value={material.quantityToAdd}
                              onChange={(e) =>
                                handleQuantityChange(
                                  material._id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              size="sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleRemoveMaterial(material._id)}
                              className="text-danger p-0"
                            >
                              <X size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <div className="d-flex gap-2 w-100 justify-content-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || loadingData || selectedMaterials.length === 0}
            className="d-flex align-items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" />
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
      </Modal.Footer>
    </Modal>
  );
};

export default AddMaterialsModal;
