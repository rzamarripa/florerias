import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle, DoorOpen, DoorClosed } from "lucide-react";
import { toast } from "react-toastify";
import { cashRegistersService } from "../services/cashRegisters";
import { CashRegister } from "../types";
import CashRegisterModal from "./CashRegisterModal";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface CashRegisterActionsProps {
  cashRegister: CashRegister;
  onCashRegisterUpdated?: () => void;
}

const CashRegisterActions: React.FC<CashRegisterActionsProps> = ({
  cashRegister,
  onCashRegisterUpdated,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [isTogglingOpen, setIsTogglingOpen] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const { getIsAdmin } = useUserRoleStore();
  const { getUserId } = useUserSessionStore();
  const isAdmin = getIsAdmin();
  const userId = getUserId();

  // Verificar si el usuario actual puede abrir/cerrar esta caja
  // Administradores pueden controlar cualquier caja
  // Cajeros y gerentes solo pueden controlar su caja asignada
  const canToggleOpen = () => {
    if (isAdmin) return true;
    const cashierId = typeof cashRegister.cashierId === "string" ? cashRegister.cashierId : cashRegister.cashierId._id;
    const managerId = typeof cashRegister.managerId === "string" ? cashRegister.managerId : cashRegister.managerId._id;
    return userId === cashierId || userId === managerId;
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
      setIsTogglingOpen(true);
      await cashRegistersService.toggleOpen(cashRegister._id, !cashRegister.isOpen);
      toast.success(
        cashRegister.isOpen
          ? "Caja registradora cerrada correctamente"
          : "Caja registradora abierta correctamente"
      );
      onCashRegisterUpdated?.();
    } catch (error: any) {
      console.error("Error toggling cash register open status:", error);
      const errorMessage =
        error.message ||
        `Error al ${cashRegister.isOpen ? "cerrar" : "abrir"} la caja registradora`;
      toast.error(errorMessage);
    } finally {
      setIsTogglingOpen(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-2">
        {/* Edit Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant="light"
            size="sm"
            className="rounded-circle"
            style={{ width: "32px", height: "32px", padding: "0" }}
            onClick={() => setShowEditModal(true)}
            title="Editar caja registradora"
          >
            <Edit2 size={16} />
          </Button>
        )}

        {/* Toggle Active Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant="light"
            size="sm"
            className="rounded-circle"
            style={{ width: "32px", height: "32px", padding: "0" }}
            onClick={handleToggleActive}
            disabled={isToggling}
            title={cashRegister.isActive ? "Desactivar caja" : "Activar caja"}
          >
            {isToggling ? (
              <Spinner
                animation="border"
                size="sm"
                style={{ width: "16px", height: "16px" }}
              />
            ) : cashRegister.isActive ? (
              <XCircle size={16} className="text-danger" />
            ) : (
              <CheckCircle size={16} className="text-success" />
            )}
          </Button>
        )}

        {/* Toggle Open/Close Button - Visible para admin, cajeros y gerentes de esta caja */}
        {canToggleOpen() && (
          <Button
            variant="light"
            size="sm"
            className="rounded-circle"
            style={{ width: "32px", height: "32px", padding: "0" }}
            onClick={handleToggleOpen}
            disabled={isTogglingOpen || !cashRegister.isActive}
            title={cashRegister.isOpen ? "Cerrar caja" : "Abrir caja"}
          >
            {isTogglingOpen ? (
              <Spinner
                animation="border"
                size="sm"
                style={{ width: "16px", height: "16px" }}
              />
            ) : cashRegister.isOpen ? (
              <DoorClosed size={16} className="text-warning" />
            ) : (
              <DoorOpen size={16} className="text-info" />
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
