import React, { useState } from "react";
import { Spinner } from "react-bootstrap";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { expenseConceptCategoryService } from "../services/expenseConceptCategories";
import { ExpenseConceptCategory } from "../types";
import ExpenseConceptCategoryModal from "./ExpenseConceptCategoryModal";

interface Props {
  categoria: ExpenseConceptCategory;
  onCategoriaSaved: () => void;
}

const ExpenseConceptCategoryActions: React.FC<Props> = ({
  categoria,
  onCategoriaSaved,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleToggleCategoria = async () => {
    setIsToggling(true);
    try {
      const response = await expenseConceptCategoryService.toggleStatus(
        categoria._id,
        categoria.isActive
      );
      if (response.success) {
        const action = categoria.isActive ? 'desactivada' : 'activada';
        toast.success(`Categoría "${categoria.name}" ${action} exitosamente`);
        if (onCategoriaSaved) onCategoriaSaved();
      } else {
        throw new Error(response.message || `Error al ${categoria.isActive ? 'desactivar' : 'activar'} la categoría`);
      }
    } catch (error: any) {
      console.error("Error toggling category:", error);

      let errorMessage = `Error al ${categoria.isActive ? 'desactivar' : 'activar'} la categoría "${categoria.name}"`;

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

  return (
    <div className="d-flex justify-content-center gap-1">
      <ExpenseConceptCategoryModal
        mode="edit"
        editingCategoria={categoria}
        onCategoriaSaved={onCategoriaSaved}
      />
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title={categoria.isActive ? "Desactivar categoría" : "Activar categoría"}
        onClick={handleToggleCategoria}
        disabled={isToggling}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : categoria.isActive ? (
          <FiTrash2 size={16} />
        ) : (
          <BsCheck2 size={16} />
        )}
      </button>
    </div>
  );
};

export default ExpenseConceptCategoryActions;
