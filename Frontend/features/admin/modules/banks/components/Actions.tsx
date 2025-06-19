import React, { useState } from "react";
import { Spinner } from "react-bootstrap";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { banksService } from "../services/banks";
import BankModal from "./BankModal";

interface Bank {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface BankActionsProps {
  bank: Bank;
  onBankSaved?: () => void;
}

const BankActions: React.FC<BankActionsProps> = ({
  bank,
  onBankSaved,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleToggleBank = async (id: string, currentStatus: boolean) => {
    try {
      setIsToggling(true);

      let response;
      if (currentStatus) {
        response = await banksService.delete(id);
      } else {
        response = await banksService.activate(id);
      }

      if (response.success) {
        const action = currentStatus ? "desactivado" : "activado";
        toast.success(`Banco "${bank.name}" ${action} correctamente`);
        onBankSaved?.();
      } else {
        const errorMessage =
          response.message ||
          `Error al ${currentStatus ? "desactivar" : "activar"} el banco`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error toggling bank:", error);
      let errorMessage = `Error al ${currentStatus ? "desactivar" : "activar"} el banco "${bank.name}"`;
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.response?.status === 404) {
        errorMessage = "Banco no encontrado";
      } else if (error.response?.status >= 500) {
        errorMessage = "Error interno del servidor. Intenta nuevamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  const getToggleButtonTitle = () => {
    if (isToggling) {
      return bank.isActive ? "Desactivando..." : "Activando...";
    }
    return bank.isActive ? "Desactivar banco" : "Activar banco";
  };

  const getToggleButtonClass = () => {
    let baseClass = "btn btn-light btn-icon btn-sm rounded-circle";
    if (isToggling) {
      baseClass += " disabled";
    }
    return baseClass;
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <BankModal
        mode="edit"
        editingBank={bank}
        onBankSaved={onBankSaved}
      />
      <button
        className={getToggleButtonClass()}
        title={getToggleButtonTitle()}
        onClick={() => handleToggleBank(bank._id, bank.isActive)}
        disabled={isToggling}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : bank.isActive ? (
          <FiTrash2 size={16} />
        ) : (
          <BsCheck2 size={16} />
        )}
      </button>
    </div>
  );
};

export default BankActions; 