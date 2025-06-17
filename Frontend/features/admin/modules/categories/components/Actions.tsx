import React from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Category } from "../types";
import CategoryModal from "./CategoryModal";


interface CategoryActionsProps {
  categoria: Category;
  onCategoriaSaved?: () => void;
}

const CategoryActions: React.FC<CategoryActionsProps> = ({
  categoria,
  onCategoriaSaved,
}) => {
  const handleToggleCategoria = async (id: string, currentStatus: boolean) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); 

      const action = currentStatus ? 'desactivada' : 'activada';
      
      console.log(`Toggle categoria status for ID: ${id}, from ${currentStatus} to ${!currentStatus}`);
      
      toast.success(`Categoría "${categoria.nombre}" ${action} correctamente`);
      
      onCategoriaSaved?.();
    } catch (error) {
      const action = currentStatus ? 'desactivar' : 'activar';
      const errorMessage = `Error al ${action} la categoría "${categoria.nombre}"`;
      toast.error(errorMessage);
      console.error(`Error ${action} categoria:`, error);
    }
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <CategoryModal
        mode="edit"
        editingCategoria={categoria}
        onCategoriaSaved={onCategoriaSaved}
      />
      
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title={
          categoria.status
            ? "Desactivar categoría"
            : "Activar categoría"
        }
        onClick={() => handleToggleCategoria(categoria._id, categoria.status)}
      >
        {categoria.status ? (
          <FiTrash2 size={16} />
        ) : (
          <BsCheck2 size={16} />
        )}
      </button>
    </div>
  );
};

export default CategoryActions;