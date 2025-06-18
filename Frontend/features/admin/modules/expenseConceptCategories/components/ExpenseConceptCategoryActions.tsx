import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
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
  const handleToggleStatus = async () => {
    try {
      const response = await expenseConceptCategoryService.toggleStatus(
        categoria._id,
        categoria.isActive
      );
      if (response.success) {
        toast.success("Estado actualizado correctamente");
        onCategoriaSaved();
      } else {
        toast.error(response.message || "Error al actualizar el estado");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el estado");
    }
  };

  return (
    <ButtonGroup>
      <ExpenseConceptCategoryModal
        mode="edit"
        editingCategoria={categoria}
        onCategoriaSaved={onCategoriaSaved}
        buttonProps={{}}
      />
      <Button
        variant={categoria.isActive ? "danger" : "success"}
        size="sm"
        onClick={handleToggleStatus}
        title={categoria.isActive ? "Desactivar" : "Activar"}
      >
        {categoria.isActive ? "Desactivar" : "Activar"}
      </Button>
    </ButtonGroup>
  );
};

export default ExpenseConceptCategoryActions;
