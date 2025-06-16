import { BsCheck2, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { Company } from "../services/companies";
import CompanyModal from "./CompanyModal";
import React from "react";

interface ActionsProps {
  company: Company;
  onToggleStatus: (company: Company) => Promise<void>;
  onCompanyUpdated?: () => void;
  onEdit: (data: any) => Promise<void>;
}

export const Actions = ({ company, onToggleStatus, onCompanyUpdated, onEdit }: ActionsProps) => {
  const [showEdit, setShowEdit] = React.useState(false);
  return (
    <div className="d-flex justify-content-center gap-1">
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Editar razón social"
        onClick={() => setShowEdit(true)}
        tabIndex={0}
      >
        <BsPencil size={16} />
      </button>
      <CompanyModal
        company={company}
        show={showEdit}
        onClose={() => setShowEdit(false)}
        onSave={async (data) => {
          await onEdit({ ...company, ...data });
          setShowEdit(false);
          onCompanyUpdated?.();
        }}
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
    </div>
  );
};