import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { expenseConceptsService } from "../services/expenseConcepts";
import { ExpenseConcept } from "../types";

import { Button } from "@/components/ui/button";

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
    <div className="flex justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleEdit}
        title="Editar concepto"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={concept.isActive ? "Desactivar concepto" : "Activar concepto"}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : concept.isActive ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </Button>
    </div>
  );
};

export default ExpenseConceptActions;
