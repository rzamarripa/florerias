import React from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import ExpenseConceptModal from "./ExpenseConceptModal";
import { ExpenseConcept } from "../types";
import { expenseConceptService } from "../services/expenseConcepts";
import { toast } from "react-toastify";

interface ExpenseConceptActionsProps {
  concepto: ExpenseConcept;
  onConceptoUpdated: () => void;
  onConceptoDeleted: () => void;
}

const ExpenseConceptActions: React.FC<ExpenseConceptActionsProps> = ({
  concepto,
  onConceptoUpdated,
  onConceptoDeleted,
}) => {
  const handleToggleStatus = async () => {
    try {
      if (concepto.isActive) {
        const res = await expenseConceptService.delete(concepto._id);
        if (res.success) {
          toast.success("Concepto de gasto desactivado exitosamente");
          onConceptoDeleted();
        } else {
          toast.error(res.message || "Error al desactivar concepto de gasto");
        }
      } else {
        const res = await expenseConceptService.activate(concepto._id);
        if (res.success) {
          toast.success("Concepto de gasto activado exitosamente");
          onConceptoUpdated();
        } else {
          toast.error(res.message || "Error al activar concepto de gasto");
        }
      }
    } catch (error) {
      const action = concepto.isActive ? "desactivar" : "activar";
      toast.error(`Error al ${action} el concepto de gasto`);
      console.error(`Error ${action} concepto de gasto:`, error);
    }
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <ExpenseConceptModal
        mode="edit"
        editingConcepto={concepto}
        onConceptoSaved={onConceptoUpdated}
      />

      {concepto.isActive ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar concepto de gasto"
          onClick={handleToggleStatus}
          tabIndex={0}
        >
          <FiTrash2 size={16} />
        </button>
      ) : (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Activar concepto de gasto"
          onClick={handleToggleStatus}
          tabIndex={0}
        >
          <BsCheck2 size={16} />
        </button>
      )}
    </div>
  );
};

export default ExpenseConceptActions; 