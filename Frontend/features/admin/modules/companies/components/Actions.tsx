import { useState } from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { GiBank } from "react-icons/gi";
import BankAccountModal from "../../bankAccounts/components/BankAccountModal";
import { Company } from "../types";
import CompanyModal from "./CompanyModal";

interface ActionsProps {
  company: Company;
  onToggleStatus: (company: Company) => Promise<void>;
  reloadData: (isCreating: boolean, page?: number) => Promise<void>;
}

export const Actions = ({
  company,
  onToggleStatus,
  reloadData,
}: ActionsProps) => {
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);

  const handleCompanySaved = () => {
    reloadData(false);
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <BankAccountModal
        mode="create"
        editingBankAccount={null}
        onBankAccountSaved={() => {
          setShowBankAccountModal(false);
          reloadData(false);
        }}
        defaultCompanyId={company._id}
        show={showBankAccountModal}
        onClose={() => setShowBankAccountModal(false)}
      />

      <CompanyModal
        company={company}
        mode="edit"
        onCompanySaved={handleCompanySaved}
      />

      {company.isActive ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar razón social"
          onClick={(e) => {
            e.preventDefault();
            onToggleStatus(company);
          }}
          tabIndex={0}
        >
          <FiTrash2 size={16} />
        </button>
      ) : (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Activar razón social"
          onClick={(e) => {
            e.preventDefault();
            onToggleStatus(company);
          }}
          tabIndex={0}
        >
          <BsCheck2 size={16} />
        </button>
      )}

      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Nueva cuenta bancaria"
        onClick={() => setShowBankAccountModal(true)}
        tabIndex={0}
      >
        <GiBank size={16} />
      </button>
    </div>
  );
};
