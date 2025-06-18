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

  const handleToggleCategoria = async (id: string, currentStatus: boolean) => {
    try {
      setIsToggling(true);
      const response = await expenseConceptCategoryService.toggleStatus(
        id,
        currentStatus
      );
      if (response.success) {
        const action = currentStatus ? "desactivada" : "activada";
        toast.success(`Categoría "${categoria.name}" ${action} correctamente`);
        onCategoriaSaved();
      } else {
        const errorMessage =
          response.message ||
          `Error al ${currentStatus ? "desactivar" : "activar"} la categoría`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      let errorMessage = `Error al ${
        categoria.isActive ? "desactivar" : "activar"
      } la categoría "${categoria.name}"`;
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
      return categoria.isActive ? "Desactivando..." : "Activando...";
    }
    return categoria.isActive ? "Desactivar categoría" : "Activar categoría";
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
      <ExpenseConceptCategoryModal
        mode="edit"
        editingCategoria={categoria}
        onCategoriaSaved={onCategoriaSaved}
      />
      <button
        className={getToggleButtonClass()}
        title={getToggleButtonTitle()}
        onClick={() => handleToggleCategoria(categoria._id, categoria.isActive)}
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
