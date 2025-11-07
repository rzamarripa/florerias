import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { providersService } from "../services/providers";
import { Provider } from "../types";

interface ProviderActionsProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onProviderUpdated?: () => void;
}

const ProviderActions: React.FC<ProviderActionsProps> = ({
  provider,
  onEdit,
  onProviderUpdated,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleEdit = () => {
    onEdit(provider);
  };

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      if (provider.isActive) {
        await providersService.deactivateProvider(provider._id);
        toast.success("Proveedor desactivado correctamente");
      } else {
        await providersService.activateProvider(provider._id);
        toast.success("Proveedor activado correctamente");
      }
      onProviderUpdated?.();
    } catch (error: any) {
      console.error("Error toggling provider status:", error);
      const errorMessage =
        error.message ||
        `Error al ${provider.isActive ? "desactivar" : "activar"} el proveedor`;
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
        title="Editar proveedor"
      >
        <Edit2 size={16} />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant={provider.isActive ? "light" : "light"}
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={provider.isActive ? "Desactivar proveedor" : "Activar proveedor"}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : provider.isActive ? (
          <XCircle size={16} className="text-danger" />
        ) : (
          <CheckCircle size={16} className="text-success" />
        )}
      </Button>
    </div>
  );
};

export default ProviderActions;
