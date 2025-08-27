import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Button, Spinner } from "react-bootstrap";
import { FaRegEye } from "react-icons/fa";
import { Check, Banknote } from "lucide-react";
import { toast } from "react-toastify";
import {
  toggleInvoicesPackageActive,
  markPackageAsPaid,
} from "../services/invoicesPackpage";

interface PackpageActionsProps {
  packpageId: string;
  packageStatus?: string;
  active?: boolean;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onMarkAsPaid?: () => void;
  loadingToggle?: boolean;
}

const PackpageActions: React.FC<PackpageActionsProps> = ({
  packpageId,
  packageStatus,
  active = true,
  onEdit,
  onToggleActive,
  onMarkAsPaid,
  loadingToggle,
}) => {
  const router = useRouter();
  const [loadingMarkAsPaid, setLoadingMarkAsPaid] = useState(false);

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

  const handleMarkAsPaid = async () => {
    try {
      setLoadingMarkAsPaid(true);
      await markPackageAsPaid(packpageId);
      toast.success("Paquete marcado como pagado exitosamente.");

      if (onMarkAsPaid) {
        onMarkAsPaid();
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al marcar el paquete como pagado.");
    } finally {
      setLoadingMarkAsPaid(false);
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
        ) : active ? (
          <FiTrash2 size={16} />
        ) : (
          <Check size={16} />
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

      {/* Botón para marcar como pagado - solo visible cuando el estatus es "Generado" */}
      {packageStatus === "Generado" && (
        <Button
          variant="light"
          size="sm"
          className="btn-icon rounded-circle"
          title="Marcar como pagado"
          onClick={handleMarkAsPaid}
          disabled={loadingMarkAsPaid}
        >
          {loadingMarkAsPaid ? (
            <Spinner
              animation="border"
              size="sm"
              style={{ width: 16, height: 16 }}
            />
          ) : (
            <Banknote size={16} />
          )}
        </Button>
      )}
    </div>
  );
};

export default PackpageActions;
