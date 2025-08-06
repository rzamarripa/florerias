import React from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Button, Spinner } from "react-bootstrap";
import { FaRegEye } from "react-icons/fa";
import { toast } from "react-toastify";
import { toggleInvoicesPackageActive } from "../services/invoicesPackpage";

interface PackpageActionsProps {
  packpageId: string;
  packageStatus?: string;
  active?: boolean;
  onEdit?: () => void;
  onToggleActive?: () => void;
  loadingToggle?: boolean;
}

const PackpageActions: React.FC<PackpageActionsProps> = ({
  packpageId,
  packageStatus,
  active = true,
  onEdit,
  onToggleActive,
  loadingToggle,
}) => {
  const router = useRouter();

  const handleToggleActive = async () => {
    try {
      const newActiveState = !active;

      // Validar que no se pueda desactivar paquetes con estatus "Generado" o "Programado"
      if (
        !newActiveState &&
        (packageStatus === "Generado" || packageStatus === "Programado")
      ) {
        toast.error(
          'No se puede desactivar un paquete con estatus "Generado" o "Programado".'
        );
        return;
      }

      await toggleInvoicesPackageActive(packpageId, newActiveState);
      toast.success(
        `Paquete ${newActiveState ? "activado" : "desactivado"} exitosamente.`
      );

      if (onToggleActive) {
        onToggleActive();
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al cambiar el estado del paquete.");
    }
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title="Ver detalle"
        onClick={() =>
          router.push(
            `/modulos/paquetes-facturas/detalle-paquete?packpageId=${packpageId}`
          )
        }
      >
        <FaRegEye size={16} />
      </Button>

      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title={active ? "Desactivar" : "Activar"}
        onClick={handleToggleActive}
        disabled={loadingToggle}
      >
        {loadingToggle ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: 16, height: 16 }}
          />
        ) : (
          <FiTrash2 size={16} />
        )}
      </Button>

      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title="Editar"
        onClick={onEdit}
      >
        <FiEdit2 size={16} />
      </Button>
    </div>
  );
};

export default PackpageActions;
