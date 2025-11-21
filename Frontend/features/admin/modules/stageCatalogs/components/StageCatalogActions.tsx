import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { stageCatalogsService } from "../services/stageCatalogs";
import { StageCatalog } from "../types";

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
    <div className="d-flex justify-content-center gap-2">
      {/* Edit Button */}
      <Button
        variant="light"
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleEdit}
        title="Editar etapa"
      >
        <Edit2 size={16} />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant={stage.isActive ? "light" : "light"}
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={stage.isActive ? "Desactivar etapa" : "Activar etapa"}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : stage.isActive ? (
          <XCircle size={16} className="text-danger" />
        ) : (
          <CheckCircle size={16} className="text-success" />
        )}
      </Button>
    </div>
  );
};

export default StageCatalogActions;
