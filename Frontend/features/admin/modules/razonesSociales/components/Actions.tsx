import { BsCheck2, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { RazonSocial } from "../services/razonesSociales";
import RazonSocialModal from "./RazonSocialModal";
import React from "react";

interface ActionsProps {
  razon: RazonSocial;
  onToggleStatus: (razon: RazonSocial) => Promise<void>;
  onRazonUpdated?: () => void;
  onEdit: (data: any) => Promise<void>;
}

export const Actions = ({ razon, onToggleStatus, onRazonUpdated, onEdit }: ActionsProps) => {
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
      <RazonSocialModal
        razon={razon}
        show={showEdit}
        onClose={() => setShowEdit(false)}
        onSave={async (data) => {
          await onEdit({ ...razon, ...data });
          setShowEdit(false);
          onRazonUpdated?.();
        }}
      />
      {razon.estatus ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar razón social"
          onClick={(e) => {
            e.preventDefault();
            onToggleStatus({ ...razon, estatus: false });
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
            onToggleStatus({ ...razon, estatus: true });
          }}
          tabIndex={0}
        >
          <BsCheck2 size={16} />
        </button>
      )}
    </div>
  );
}; 