import { BsCheck2, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import CompanyModal from "./CompanyModal";
import React, { useState } from "react";
import { Company } from "../services/companies";

interface ActionsProps {
  company: Company;
  onToggleStatus: (company: Company) => Promise<void>;
  reloadData: (isCreating: boolean, page?: number) => Promise<void>
}

export const Actions = ({ company, onToggleStatus, reloadData }: ActionsProps) => {
  const [showEdit, setShowEdit] = React.useState(false);
  const [editingCompany] = useState<string>(company._id)

  

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
    </div>
  );
};