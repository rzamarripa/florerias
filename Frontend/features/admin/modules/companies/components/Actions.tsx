import { BsCheck2, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import CompanyModal from "./CompanyModal";
import React, { useState } from "react";
import { Company } from "../types";
import { GiBank } from "react-icons/gi";
import BankAccountModal from "../../bankAccounts/components/BankAccountModal";
import Link from "next/link";

interface ActionsProps {
  company: Company;
  onToggleStatus: (company: Company) => Promise<void>;
  reloadData: (isCreating: boolean, page?: number) => Promise<void>
  bankAccountsCount: Record<string, number>;
}

export const Actions = ({ company, onToggleStatus, reloadData, bankAccountsCount }: ActionsProps) => {
  const [showEdit, setShowEdit] = React.useState(false);
  const [editingCompany] = useState<string>(company._id)
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);

  return (
    <div className="d-flex justify-content-center gap-1">
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Editar empresa" 
        onClick={() => setShowEdit(true)}
        tabIndex={0}
      >
        <BsPencil size={16} />
      </button>

      <CompanyModal
        company={company}
        show={showEdit}
        onClose={() => setShowEdit(false)}
        editingCompany={editingCompany}
        reloadData={reloadData}
      />

      {company.isActive ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar empresa" 
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
          title="Activar empresa" 
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

      <BankAccountModal
        mode="create"
        editingBankAccount={null}
        onBankAccountSaved={() => { setShowBankAccountModal(false); reloadData(false); }}
        defaultCompanyId={company._id}
        show={showBankAccountModal}
        onClose={() => setShowBankAccountModal(false)}
      />

      <Link
        href={{ pathname: "/catalogos/cuentas-bancarias", query: { company: company._id } }}
        style={{ textDecoration: 'underline', cursor: 'pointer' }}
      >
        {bankAccountsCount[company._id] ?? '0'} Cuentas
      </Link>
    </div>
  );
};