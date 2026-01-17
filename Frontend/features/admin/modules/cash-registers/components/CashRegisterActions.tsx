import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, DoorOpen, DoorClosed, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { cashRegistersService } from "../services/cashRegisters";
import { CashRegister } from "../types";
import CashRegisterModal from "./CashRegisterModal";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { Button } from "@/components/ui/button";

interface CashRegisterActionsProps {
  cashRegister: CashRegister;
  onCashRegisterUpdated?: () => void;
}

const CashRegisterActions: React.FC<CashRegisterActionsProps> = ({
  cashRegister,
  onCashRegisterUpdated,
}) => {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [isTogglingOpen, setIsTogglingOpen] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const { getIsAdmin, getIsCashier, getIsSocialMedia } = useUserRoleStore();
  const isAdmin = getIsAdmin();
  const isCashier = getIsCashier();
  const isSocialMedia = getIsSocialMedia();

  // Verificar si el usuario actual puede abrir/cerrar esta caja
  // - Cajeros pueden abrir/cerrar cajas normales
  // - Usuarios de "Redes" pueden abrir/cerrar cajas de redes sociales
  const canToggleOpen = () => {
    // Si es caja de redes sociales, solo usuarios de rol "Redes" pueden abrirla
    if (cashRegister.isSocialMediaBox) {
      return isSocialMedia;
    }
    // Si es caja normal, solo cajeros pueden abrirla
    return isCashier;
  };

  const handleToggleActive = async () => {
    try {
      setIsToggling(true);
      await cashRegistersService.toggleActive(cashRegister._id, !cashRegister.isActive);
      toast.success(
        cashRegister.isActive
          ? "Caja registradora desactivada correctamente"
          : "Caja registradora activada correctamente"
      );
      onCashRegisterUpdated?.();
    } catch (error: any) {
      console.error("Error toggling cash register status:", error);
      const errorMessage =
        error.message ||
        `Error al ${cashRegister.isActive ? "desactivar" : "activar"} la caja registradora`;
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggleOpen = async () => {
    try {
      // Si la caja esta abierta y se quiere cerrar, navegar a la pagina de resumen
      if (cashRegister.isOpen) {
        router.push(`/ventas/cajas/cerrar?id=${cashRegister._id}`);
        return;
      }

      // Si la caja esta cerrada, abrirla normalmente
      setIsTogglingOpen(true);
      await cashRegistersService.toggleOpen(cashRegister._id, true);
      toast.success("Caja registradora abierta correctamente");
      onCashRegisterUpdated?.();
    } catch (error: any) {
      console.error("Error toggling cash register open status:", error);
      const errorMessage = error.message || "Error al abrir la caja registradora";
      toast.error(errorMessage);
    } finally {
      setIsTogglingOpen(false);
    }
  };

  return (
    <>
      <div className="flex justify-center gap-2">
        {/* Edit Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={() => setShowEditModal(true)}
            title="Editar caja registradora"
          >
            <Edit2 size={16} />
          </Button>
        )}

        {/* Toggle Active Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={handleToggleActive}
            disabled={isToggling}
            title={cashRegister.isActive ? "Desactivar caja" : "Activar caja"}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cashRegister.isActive ? (
              <XCircle size={16} className="text-red-500" />
            ) : (
              <CheckCircle size={16} className="text-green-500" />
            )}
          </Button>
        )}

        {/* Toggle Open/Close Button - Visible para admin, cajeros y gerentes de esta caja */}
        {canToggleOpen() && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={handleToggleOpen}
            disabled={isTogglingOpen || !cashRegister.isActive}
            title={cashRegister.isOpen ? "Cerrar caja" : "Abrir caja"}
          >
            {isTogglingOpen ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cashRegister.isOpen ? (
              <DoorClosed size={16} className="text-yellow-500" />
            ) : (
              <DoorOpen size={16} className="text-cyan-500" />
            )}
          </Button>
        )}
      </div>

      {/* Edit Modal - Solo para Administradores */}
      {isAdmin && (
        <CashRegisterModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          cashRegister={cashRegister}
          onCashRegisterSaved={onCashRegisterUpdated}
        />
      )}
    </>
  );
};

export default CashRegisterActions;
