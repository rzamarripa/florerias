import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { stageCatalogsService } from "../services/stageCatalogs";
import { StageCatalog } from "../types";

import { Button } from "@/components/ui/button";

interface StageCatalogActionsProps {
  stage: StageCatalog;
  onEdit: (stage: StageCatalog) => void;
  onStageUpdated?: () => void;
}

const StageCatalogActions: React.FC<StageCatalogActionsProps> = ({
  stage,
  onEdit,
  onStageUpdated,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleEdit = () => {
    onEdit(stage);
  };

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      if (stage.isActive) {
        await stageCatalogsService.deactivateStageCatalog(stage._id);
        toast.success("Etapa desactivada correctamente");
      } else {
        await stageCatalogsService.activateStageCatalog(stage._id);
        toast.success("Etapa activada correctamente");
      }
      onStageUpdated?.();
    } catch (error: any) {
      console.error("Error toggling stage status:", error);
      const errorMessage =
        error.message ||
        `Error al ${stage.isActive ? "desactivar" : "activar"} la etapa`;
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleEdit}
        title="Editar etapa"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={stage.isActive ? "Desactivar etapa" : "Activar etapa"}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : stage.isActive ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </Button>
    </div>
  );
};

export default StageCatalogActions;
