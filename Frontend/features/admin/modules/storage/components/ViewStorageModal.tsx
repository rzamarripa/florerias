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
import { Package, Calendar, User, Save, Edit2, ArrowLeft, Boxes, Archive, Loader2, X } from "lucide-react";
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
    // Si unit es un string (ObjectId), mostrar guion
    if (typeof unit === "string" && unit.length > 10) {
      return "-";
    }
    return unit;
  };

  const getProductId = (productItem: any): string => {
    return typeof productItem.productId === "string" ? productItem.productId : productItem.productId._id;
  };

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">{getBranchName()}</DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant={storage?.isActive ? "default" : "destructive"}
                  className="px-3 py-1"
                >
                  {storage?.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <span className="text-muted-foreground text-sm flex items-center">
                  <User size={14} className="mr-1" />
                  {getManagerName()}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="py-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2 mb-0 text-sm">Cargando...</p>
            </div>
          ) : storage ? (
            <>
              {/* Estadisticas compactas */}
              <div className="flex border-b bg-muted/30 rounded-t-lg">
                <div className="flex-1 text-center py-3 border-r">
                  <div className="flex items-center justify-center gap-2">
                    <Package size={20} className="text-primary" />
                    <span className="text-2xl font-bold">{getTotalProducts()}</span>
                  </div>
                  <small className="text-muted-foreground">Productos</small>
                </div>
                <div className="flex-1 text-center py-3 border-r">
                  <div className="flex items-center justify-center gap-2">
                    <Boxes size={20} className="text-green-500" />
                    <span className="text-2xl font-bold">{getTotalQuantity()}</span>
                  </div>
                  <small className="text-muted-foreground">Unidades</small>
                </div>
                <div className="flex-1 text-center py-3 border-r">
                  <div className="flex items-center justify-center gap-2">
                    <Archive size={20} className="text-yellow-500" />
                    <span className="text-2xl font-bold">{getTotalMaterials()}</span>
                  </div>
                  <small className="text-muted-foreground">Materiales</small>
                </div>
                <div className="flex-1 text-center py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Archive size={20} className="text-blue-500" />
                    <span className="text-2xl font-bold">{getTotalMaterialsQuantity()}</span>
                  </div>
                  <small className="text-muted-foreground">Uds. Mat.</small>
                </div>
              </div>

              {/* Fechas compactas */}
              <div className="flex border-b px-4 py-2 bg-background">
                <div className="flex-1">
                  <small className="text-muted-foreground">
                    <Calendar size={12} className="inline mr-1" />
                    Ultimo ingreso: <strong>{formatDate(storage.lastIncome)}</strong>
                  </small>
                </div>
                <div className="flex-1 text-right">
                  <small className="text-muted-foreground">
                    <Calendar size={12} className="inline mr-1" />
                    Ultimo egreso: <strong>{formatDate(storage.lastOutcome)}</strong>
                  </small>
                </div>
              </div>

              {/* Productos */}
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h6 className="mb-0 font-bold text-base flex items-center">
                    <Package size={18} className="mr-2 text-primary" />
                    Productos
                  </h6>
                  {!editMode && storage.products.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEnterEditMode}
                      className="flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      Editar
                    </Button>
                  )}
                </div>

                {storage.products.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                    <Package size={32} className="mb-2 opacity-50 mx-auto" />
                    <p className="mb-0">Sin productos</p>
                  </div>
                ) : (
                  <div className="max-h-[250px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/80">
                        <TableRow>
                          <TableHead className="py-2 px-3 text-sm">Producto</TableHead>
                          <TableHead className="py-2 px-2 text-center text-sm w-[80px]">Unidad</TableHead>
                          <TableHead className="py-2 px-3 text-right text-sm w-[100px]">Cantidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storage.products.map((item) => {
                          const productId = getProductId(item);
                          return (
                            <TableRow key={item._id}>
                              <TableCell className="py-2 px-3 text-sm">
                                {getProductName(item)}
                              </TableCell>
                              <TableCell className="py-2 px-2 text-center">
                                <Badge variant="outline" className="text-xs">
                                  {getProductUnit(item)}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 px-3 text-right">
                                {editMode ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editedQuantities[productId] || 0}
                                    onChange={(e) =>
                                      handleQuantityChange(productId, parseInt(e.target.value) || 0)
                                    }
                                    className="h-8 w-20 text-right inline-block"
                                  />
                                ) : (
                                  <span
                                    className="font-bold"
                                    style={{
                                      color: item.quantity > 0 ? "#16a34a" : "#dc2626"
                                    }}
                                  >
                                    {item.quantity}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Materiales */}
              {storage.materials && storage.materials.length > 0 && (
                <div className="p-3 pt-0">
                  <h6 className="mb-2 font-bold text-base flex items-center">
                    <Archive size={18} className="mr-2 text-yellow-500" />
                    Materiales
                  </h6>
                  <div className="max-h-[200px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/80">
                        <TableRow>
                          <TableHead className="py-2 px-3 text-sm">Material</TableHead>
                          <TableHead className="py-2 px-2 text-center text-sm w-[80px]">Unidad</TableHead>
                          <TableHead className="py-2 px-3 text-right text-sm w-[100px]">Cantidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storage.materials.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell className="py-2 px-3 text-sm">
                              {getMaterialName(item)}
                            </TableCell>
                            <TableCell className="py-2 px-2 text-center">
                              <Badge variant="outline" className="text-xs">
                                {getMaterialUnit(item)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-right">
                              <span
                                className="font-bold"
                                style={{
                                  color: item.quantity > 0 ? "#f97316" : "#dc2626"
                                }}
                              >
                                {item.quantity}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay datos disponibles</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex justify-between">
          <div>
            {fromOrder && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToOrder}
                className="flex items-center gap-1"
              >
                <ArrowLeft size={16} />
                Volver a Orden
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex items-center gap-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewStorageModal;
