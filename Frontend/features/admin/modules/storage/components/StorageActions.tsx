"use client";

import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { MoreVertical, Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "react-toastify";
import { storageService } from "../services/storage";
import { Storage } from "../types";
import AddProductsModal from "./AddProductsModal";
import AddMaterialsModal from "./AddMaterialsModal";
import ViewStorageModal from "./ViewStorageModal";

interface StorageActionsProps {
  storage: Storage;
  onStorageUpdated: () => void;
}

const StorageActions: React.FC<StorageActionsProps> = ({ storage, onStorageUpdated }) => {
  const [showAddProductsModal, setShowAddProductsModal] = useState<boolean>(false);
  const [showAddMaterialsModal, setShowAddMaterialsModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggleStatus = async () => {
    try {
      setLoading(true);

      if (storage.isActive) {
        await storageService.deactivateStorage(storage._id);
        toast.success("Almacén desactivado exitosamente");
      } else {
        await storageService.activateStorage(storage._id);
        toast.success("Almacén activado exitosamente");
      }

      onStorageUpdated();
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del almacén");
      console.error("Error toggling storage status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de eliminar este almacén?")) {
      return;
    }

    try {
      setLoading(true);
      await storageService.deleteStorage(storage._id);
      toast.success("Almacén eliminado exitosamente");
      onStorageUpdated();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar almacén");
      console.error("Error deleting storage:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle
          variant="light"
          size="sm"
          className="border-0"
          disabled={loading}
          style={{ background: "transparent" }}
        >
          <MoreVertical size={18} />
        </Dropdown.Toggle>

        <Dropdown.Menu align="end">
          <Dropdown.Item onClick={() => setShowViewModal(true)}>
            <Eye size={16} className="me-2" />
            Ver Detalles
          </Dropdown.Item>

          <Dropdown.Item onClick={() => setShowAddProductsModal(true)}>
            <Plus size={16} className="me-2" />
            Agregar Productos
          </Dropdown.Item>

          <Dropdown.Item onClick={() => setShowAddMaterialsModal(true)}>
            <Plus size={16} className="me-2" />
            Agregar Materiales
          </Dropdown.Item>

          <Dropdown.Divider />

          <Dropdown.Item onClick={handleToggleStatus}>
            {storage.isActive ? (
              <>
                <ToggleLeft size={16} className="me-2" />
                Desactivar
              </>
            ) : (
              <>
                <ToggleRight size={16} className="me-2" />
                Activar
              </>
            )}
          </Dropdown.Item>

          <Dropdown.Item onClick={handleDelete} className="text-danger">
            <Trash2 size={16} className="me-2" />
            Eliminar
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Modals */}
      <AddProductsModal
        show={showAddProductsModal}
        onHide={() => setShowAddProductsModal(false)}
        onProductsAdded={onStorageUpdated}
        storage={storage}
      />

      <AddMaterialsModal
        show={showAddMaterialsModal}
        onHide={() => setShowAddMaterialsModal(false)}
        onMaterialsAdded={onStorageUpdated}
        storage={storage}
      />

      <ViewStorageModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        storage={storage}
        onStorageUpdated={onStorageUpdated}
      />
    </>
  );
};

export default StorageActions;
