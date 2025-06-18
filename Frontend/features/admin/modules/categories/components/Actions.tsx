import React, { useState } from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Spinner } from "react-bootstrap";
import { categoryService } from "../services/categories";
import CategoryModal from "./CategoryModal";

interface CategoryLegacy {
  _id: string;
  nombre: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

interface CategoryActionsProps {
  categoria: CategoryLegacy;
  onCategoriaSaved?: () => void;
}

const CategoryActions: React.FC<CategoryActionsProps> = ({
  categoria,
  onCategoriaSaved,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleToggleCategoria = async (id: string, currentStatus: boolean) => {
    try {
      setIsToggling(true);

      const response = await categoryService.toggleStatus(id, currentStatus);

      if (response.success) {
        const action = currentStatus ? 'desactivada' : 'activada';
        toast.success(`Categoría "${categoria.nombre}" ${action} correctamente`);
        onCategoriaSaved?.();
      } else {
        const errorMessage = response.message || `Error al ${currentStatus ? 'desactivar' : 'activar'} la categoría`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error toggling category:", error);

      let errorMessage = `Error al ${currentStatus ? 'desactivar' : 'activar'} la categoría "${categoria.nombre}"`;

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.response?.status === 404) {
        errorMessage = "Categoría no encontrada";
      } else if (error.response?.status >= 500) {
        errorMessage = "Error interno del servidor. Intenta nuevamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  const getToggleButtonTitle = () => {
    if (isToggling) {
      return categoria.status ? "Desactivando..." : "Activando...";
    }
    return categoria.status ? "Desactivar categoría" : "Activar categoría";
  };

  const getToggleButtonClass = () => {
    let baseClass = "btn btn-light btn-icon btn-sm rounded-circle";
    if (isToggling) {
      baseClass += " disabled";
    }
    return baseClass;
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <CategoryModal
        mode="edit"
        editingCategoria={categoria}
        onCategoriaSaved={onCategoriaSaved}
      />

      <button
        className={getToggleButtonClass()}
        title={getToggleButtonTitle()}
        onClick={() => handleToggleCategoria(categoria._id, categoria.status)}
        disabled={isToggling}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : categoria.status ? (
          <FiTrash2 size={16} />
        ) : (
          <BsCheck2 size={16} />
        )}
      </button>
    </div>
  );
};

export default CategoryActions;