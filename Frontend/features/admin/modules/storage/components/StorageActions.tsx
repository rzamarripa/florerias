"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Eye, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
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
        toast.success("Almacen desactivado exitosamente");
      } else {
        await storageService.activateStorage(storage._id);
        toast.success("Almacen activado exitosamente");
      }

      onStorageUpdated();
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del almacen");
      console.error("Error toggling storage status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Estas seguro de eliminar este almacen?")) {
      return;
    }

    try {
      setLoading(true);
      await storageService.deleteStorage(storage._id);
      toast.success("Almacen eliminado exitosamente");
      onStorageUpdated();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar almacen");
      console.error("Error deleting storage:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            <MoreVertical size={18} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowViewModal(true)}>
            <Eye size={16} className="mr-2" />
            Ver Detalles
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowAddProductsModal(true)}>
            <Plus size={16} className="mr-2" />
            Agregar Productos
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowAddMaterialsModal(true)}>
            <Plus size={16} className="mr-2" />
            Agregar Materiales
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleToggleStatus}>
            {storage.isActive ? (
              <>
                <ToggleLeft size={16} className="mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <ToggleRight size={16} className="mr-2" />
                Activar
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            <Trash2 size={16} className="mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
