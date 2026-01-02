"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Badge, Spinner, Form, Row, Col } from "react-bootstrap";
import { X, Package, Calendar, MapPin, User, Save, Edit2, ArrowLeft, Boxes, Archive } from "lucide-react";
import { toast } from "react-toastify";
import { Storage } from "../types";
import { storageService } from "../services/storage";
import { useRouter } from "next/navigation";

interface ViewStorageModalProps {
  show: boolean;
  onHide: () => void;
  storage: Storage | null;
  onStorageUpdated: () => void;
  fromOrder?: boolean;
  targetProductId?: string;
}

interface ProductQuantityEdit {
  productId: string;
  quantity: number;
  originalQuantity: number;
}

const ViewStorageModal: React.FC<ViewStorageModalProps> = ({
  show,
  onHide,
  storage: initialStorage,
  onStorageUpdated,
  fromOrder = false,
  targetProductId = "",
}) => {
  const router = useRouter();
  const [storage, setStorage] = useState<Storage | null>(initialStorage);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (show && initialStorage) {
      loadStorageDetails();
    }
  }, [show, initialStorage]);

  const loadStorageDetails = async () => {
    if (!initialStorage) return;

    try {
      setLoading(true);
      const response = await storageService.getStorageById(initialStorage._id);
      setStorage(response.data);
      setEditMode(false);
      setEditedQuantities({});
    } catch (error) {
      console.error("Error loading storage details:", error);
      setStorage(initialStorage);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterEditMode = () => {
    if (!storage) return;

    const quantities: Record<string, number> = {};
    storage.products.forEach((item) => {
      const productId = typeof item.productId === "string" ? item.productId : item.productId._id;
      quantities[productId] = item.quantity;
    });
    setEditedQuantities(quantities);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedQuantities({});
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setEditedQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, newQuantity),
    }));
  };

  const handleBackToOrder = () => {
    onHide();
    router.push("/ventas/nueva-orden");
  };

  const handleSaveChanges = async () => {
    if (!storage) return;

    try {
      setSaving(true);

      const changedProducts: ProductQuantityEdit[] = [];
      storage.products.forEach((item) => {
        const productId = typeof item.productId === "string" ? item.productId : item.productId._id;
        const newQuantity = editedQuantities[productId];

        if (newQuantity !== undefined && newQuantity !== item.quantity) {
          changedProducts.push({
            productId,
            quantity: newQuantity,
            originalQuantity: item.quantity,
          });
        }
      });

      if (changedProducts.length === 0) {
        toast.info("No hay cambios para guardar");
        setEditMode(false);
        return;
      }

      for (const change of changedProducts) {
        await storageService.updateProductQuantity(storage._id, {
          productId: change.productId,
          quantity: change.quantity,
        });
      }

      toast.success("Cantidades actualizadas exitosamente");
      setEditMode(false);
      setEditedQuantities({});
      onStorageUpdated();

      const response = await storageService.getStorageById(storage._id);
      setStorage(response.data);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar las cantidades");
      console.error("Error updating quantities:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Sin registro";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProductName = (productItem: any) => {
    if (typeof productItem.productId === "string") {
      return productItem.productId;
    }
    return productItem.productId?.nombre || "N/A";
  };

  const getProductUnit = (productItem: any) => {
    if (typeof productItem.productId === "string") {
      return "-";
    }
    const unidad = productItem.productId?.unidad;
    // Si unidad es un ObjectId o string largo, mostrar solo "pieza" por defecto
    if (!unidad || unidad.length > 20) {
      return "pieza";
    }
    return unidad;
  };

  const getBranchName = () => {
    if (!storage) return "";
    if (typeof storage.branch === "string") return storage.branch;
    return storage.branch.branchName;
  };

  const getManagerName = () => {
    if (!storage) return "";
    if (!storage.warehouseManager) return "Sin asignar";
    if (typeof storage.warehouseManager === "string") return storage.warehouseManager;
    return storage.warehouseManager.profile?.fullName || storage.warehouseManager.username;
  };

  const getTotalProducts = () => {
    return storage?.products.length || 0;
  };

  const getTotalQuantity = () => {
    if (editMode) {
      return Object.values(editedQuantities).reduce((sum, qty) => sum + qty, 0);
    }
    return storage?.products.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const getTotalMaterials = () => {
    return storage?.materials?.length || 0;
  };

  const getTotalMaterialsQuantity = () => {
    return storage?.materials?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const getMaterialName = (materialItem: any) => {
    if (typeof materialItem.materialId === "string") {
      return materialItem.materialId;
    }
    return materialItem.materialId?.name || "N/A";
  };

  const getMaterialUnit = (materialItem: any) => {
    if (typeof materialItem.materialId === "string") {
      return "-";
    }
    const unit = materialItem.materialId?.unit;
    if (!unit) return "-";
    // Si unit es un objeto populado, obtener abbreviation o name
    if (typeof unit === "object") {
      return unit.abbreviation || unit.name || "-";
    }
    // Si unit es un string (ObjectId), mostrar guión
    if (typeof unit === "string" && unit.length > 10) {
      return "-";
    }
    return unit;
  };

  const getProductId = (productItem: any): string => {
    return typeof productItem.productId === "string" ? productItem.productId : productItem.productId._id;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      {/* Header */}
      <Modal.Header className="border-0 pb-2">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>
            <h4 className="mb-1 fw-bold">{getBranchName()}</h4>
            <div className="d-flex align-items-center gap-3">
              <Badge
                bg={storage?.isActive ? "success" : "danger"}
                className="px-3 py-2"
                style={{ fontSize: "0.85rem" }}
              >
                {storage?.isActive ? "Activo" : "Inactivo"}
              </Badge>
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                <User size={14} className="me-1" />
                {getManagerName()}
              </span>
            </div>
          </div>
          <Button
            variant="link"
            onClick={onHide}
            className="text-muted p-0"
          >
            <X size={24} />
          </Button>
        </div>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="text-muted mt-2 mb-0">Cargando...</p>
          </div>
        ) : storage ? (
          <>
            {/* Estadísticas compactas */}
            <div className="d-flex border-bottom" style={{ background: "#f8f9fa" }}>
              <div className="flex-fill text-center py-3 border-end">
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Package size={20} className="text-primary" />
                  <span className="fs-4 fw-bold">{getTotalProducts()}</span>
                </div>
                <small className="text-muted">Productos</small>
              </div>
              <div className="flex-fill text-center py-3 border-end">
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Boxes size={20} className="text-success" />
                  <span className="fs-4 fw-bold">{getTotalQuantity()}</span>
                </div>
                <small className="text-muted">Unidades</small>
              </div>
              <div className="flex-fill text-center py-3 border-end">
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Archive size={20} className="text-warning" />
                  <span className="fs-4 fw-bold">{getTotalMaterials()}</span>
                </div>
                <small className="text-muted">Materiales</small>
              </div>
              <div className="flex-fill text-center py-3">
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Archive size={20} className="text-info" />
                  <span className="fs-4 fw-bold">{getTotalMaterialsQuantity()}</span>
                </div>
                <small className="text-muted">Uds. Mat.</small>
              </div>
            </div>

            {/* Fechas compactas */}
            <div className="d-flex border-bottom px-4 py-2" style={{ background: "#fff" }}>
              <div className="flex-fill">
                <small className="text-muted">
                  <Calendar size={12} className="me-1" />
                  Último ingreso: <strong>{formatDate(storage.lastIncome)}</strong>
                </small>
              </div>
              <div className="flex-fill text-end">
                <small className="text-muted">
                  <Calendar size={12} className="me-1" />
                  Último egreso: <strong>{formatDate(storage.lastOutcome)}</strong>
                </small>
              </div>
            </div>

            {/* Productos */}
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-bold" style={{ fontSize: "1.1rem" }}>
                  <Package size={18} className="me-2 text-primary" />
                  Productos
                </h6>
                {!editMode && storage.products.length > 0 && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleEnterEditMode}
                    className="d-flex align-items-center gap-1"
                  >
                    <Edit2 size={14} />
                    Editar
                  </Button>
                )}
              </div>

              {storage.products.length === 0 ? (
                <div className="text-center py-3 text-muted bg-light rounded">
                  <Package size={32} className="mb-2 opacity-50" />
                  <p className="mb-0">Sin productos</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  <Table size="sm" hover className="mb-0">
                    <thead style={{ background: "#f1f3f5", position: "sticky", top: 0 }}>
                      <tr>
                        <th className="py-2 px-3" style={{ fontSize: "0.9rem" }}>Producto</th>
                        <th className="py-2 px-2 text-center" style={{ fontSize: "0.9rem", width: "80px" }}>Unidad</th>
                        <th className="py-2 px-3 text-end" style={{ fontSize: "0.9rem", width: "100px" }}>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storage.products.map((item) => {
                        const productId = getProductId(item);
                        return (
                          <tr key={item._id}>
                            <td className="py-2 px-3" style={{ fontSize: "0.95rem" }}>
                              {getProductName(item)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Badge bg="light" text="dark" style={{ fontSize: "0.8rem" }}>
                                {getProductUnit(item)}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-end">
                              {editMode ? (
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={editedQuantities[productId] || 0}
                                  onChange={(e) =>
                                    handleQuantityChange(productId, parseInt(e.target.value) || 0)
                                  }
                                  size="sm"
                                  style={{ width: "80px", display: "inline-block" }}
                                />
                              ) : (
                                <span
                                  className="fw-bold"
                                  style={{
                                    fontSize: "1rem",
                                    color: item.quantity > 0 ? "#198754" : "#dc3545"
                                  }}
                                >
                                  {item.quantity}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>

            {/* Materiales */}
            {storage.materials && storage.materials.length > 0 && (
              <div className="p-3 pt-0">
                <h6 className="mb-2 fw-bold" style={{ fontSize: "1.1rem" }}>
                  <Archive size={18} className="me-2 text-warning" />
                  Materiales
                </h6>
                <div className="table-responsive" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  <Table size="sm" hover className="mb-0">
                    <thead style={{ background: "#f1f3f5", position: "sticky", top: 0 }}>
                      <tr>
                        <th className="py-2 px-3" style={{ fontSize: "0.9rem" }}>Material</th>
                        <th className="py-2 px-2 text-center" style={{ fontSize: "0.9rem", width: "80px" }}>Unidad</th>
                        <th className="py-2 px-3 text-end" style={{ fontSize: "0.9rem", width: "100px" }}>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storage.materials.map((item) => (
                        <tr key={item._id}>
                          <td className="py-2 px-3" style={{ fontSize: "0.95rem" }}>
                            {getMaterialName(item)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Badge bg="light" text="dark" style={{ fontSize: "0.8rem" }}>
                              {getMaterialUnit(item)}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-end">
                            <span
                              className="fw-bold"
                              style={{
                                fontSize: "1rem",
                                color: item.quantity > 0 ? "#fd7e14" : "#dc3545"
                              }}
                            >
                              {item.quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-muted">
            <p>No hay datos disponibles</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top py-2 px-3">
        <div className="d-flex justify-content-between w-100">
          <div>
            {fromOrder && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleBackToOrder}
                className="d-flex align-items-center gap-1"
              >
                <ArrowLeft size={16} />
                Volver a Orden
              </Button>
            )}
          </div>
          <div className="d-flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline-secondary" size="sm" onClick={handleCancelEdit} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="d-flex align-items-center gap-1"
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={onHide}>
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewStorageModal;
