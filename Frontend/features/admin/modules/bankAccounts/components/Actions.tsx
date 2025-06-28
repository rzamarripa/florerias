import ProtectedModule from "@/components/auth/ProtectedModule";
import React, { useState } from "react";
import { Spinner } from "react-bootstrap";
import { BsCheck2, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { bankAccountsService } from "../services/bankAccounts";
import { BankAccount } from "../types";
import BankAccountModal from "./BankAccountModal";

interface BankAccountActionsProps {
  bankAccount: BankAccount;
  onBankAccountSaved?: () => void;
}

const BankAccountActions: React.FC<BankAccountActionsProps> = ({
  bankAccount,
  onBankAccountSaved,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleToggleBankAccount = async (
    id: string,
    currentStatus: boolean
  ) => {
    try {
      setIsToggling(true);
      let response;
      if (currentStatus) {
        response = await bankAccountsService.delete(id);
      } else {
        response = await bankAccountsService.activate(id);
      }
      if (response.success) {
        const action = currentStatus ? "desactivada" : "activada";
        toast.success(`Cuenta bancaria ${action} correctamente`);
        onBankAccountSaved?.();
      } else {
        const errorMessage =
          response.message ||
          `Error al ${
            currentStatus ? "desactivar" : "activar"
          } la cuenta bancaria`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error toggling bank account:", error);
      let errorMessage = `Error al ${
        currentStatus ? "desactivar" : "activar"
      } la cuenta bancaria`;
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.response?.status === 404) {
        errorMessage = "Cuenta bancaria no encontrada";
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
      return bankAccount.isActive ? "Desactivando..." : "Activando...";
    }
    return bankAccount.isActive ? "Desactivar cuenta" : "Activar cuenta";
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
      <BankAccountModal
        mode="edit"
        editingBankAccount={bankAccount}
        onBankAccountSaved={() => {
          setShowEditModal(false);
          onBankAccountSaved?.();
        }}
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Editar cuenta bancaria"
        onClick={() => setShowEditModal(true)}
        tabIndex={0}
      >
        <BsPencil size={16} />
      </button>
      <button
        className={getToggleButtonClass()}
        title={getToggleButtonTitle()}
        onClick={() =>
          handleToggleBankAccount(bankAccount._id, bankAccount.isActive)
        }
        disabled={isToggling}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : bankAccount.isActive ? (
          <FiTrash2 size={16} />
        ) : (
          <BsCheck2 size={16} />
        )}
      </button>
      <ProtectedModule module="Update" page="bankAccounts">
        <BankAccountModal
          mode="edit"
          editingBankAccount={bankAccount}
          onBankAccountSaved={onBankAccountSaved}
        />
      </ProtectedModule>
      <ProtectedModule module="Delete" page="bankAccounts">
        <button
          className={getToggleButtonClass()}
          title={getToggleButtonTitle()}
          onClick={() =>
            handleToggleBankAccount(bankAccount._id, bankAccount.isActive)
          }
          disabled={isToggling}
        >
          {isToggling ? (
            <Spinner
              animation="border"
              size="sm"
              style={{ width: "16px", height: "16px" }}
            />
          ) : bankAccount.isActive ? (
            <FiTrash2 size={16} />
          ) : (
            <BsCheck2 size={16} />
          )}
        </button>
      </ProtectedModule>
    </div>
  );
};

export default BankAccountActions;
