import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { providersService } from "../services/providers";
import { Provider } from "../types";
import { Button } from "@/components/ui/button";

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
    <div className="flex justify-center gap-2">
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleEdit}
        title="Editar proveedor"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={provider.isActive ? "Desactivar proveedor" : "Activar proveedor"}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : provider.isActive ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </Button>
    </div>
  );
};

export default ProviderActions;
