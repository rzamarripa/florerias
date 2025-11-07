import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { expenseConceptsService } from "../services/expenseConcepts";
import { ExpenseConcept } from "../types";

interface ExpenseConceptActionsProps {
  concept: ExpenseConcept;
  onEdit: (concept: ExpenseConcept) => void;
  onConceptUpdated?: () => void;
}

const ExpenseConceptActions: React.FC<ExpenseConceptActionsProps> = ({
  concept,
  onEdit,
  onConceptUpdated,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleEdit = () => {
    onEdit(concept);
  };

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      if (concept.isActive) {
        await expenseConceptsService.deactivateExpenseConcept(concept._id);
        toast.success("Concepto desactivado correctamente");
      } else {
        await expenseConceptsService.activateExpenseConcept(concept._id);
        toast.success("Concepto activado correctamente");
      }
      onConceptUpdated?.();
    } catch (error: any) {
      console.error("Error toggling concept status:", error);
      const errorMessage =
        error.message ||
        `Error al ${concept.isActive ? "desactivar" : "activar"} el concepto`;
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="d-flex justify-content-center gap-2">
      {/* Edit Button */}
      <Button
        variant="light"
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleEdit}
        title="Editar concepto"
      >
        <Edit2 size={16} />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant={concept.isActive ? "light" : "light"}
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={concept.isActive ? "Desactivar concepto" : "Activar concepto"}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : concept.isActive ? (
          <XCircle size={16} className="text-danger" />
        ) : (
          <CheckCircle size={16} className="text-success" />
        )}
      </Button>
    </div>
  );
};

export default ExpenseConceptActions;
