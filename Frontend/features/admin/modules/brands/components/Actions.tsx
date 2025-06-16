import { BsCheck2, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import React, { useState } from "react";
import { Brand } from "../types";

interface ActionsProps {
  brand: Brand;
  onToggleStatus: (brand: Brand) => Promise<void>;
  reloadData: (isCreating: boolean, page?: number) => Promise<void>
}

export const Actions = ({ brand, onToggleStatus, reloadData }: ActionsProps) => {
  const [showEdit, setShowEdit] = React.useState(false);
  const [editingBrand] = useState<string>(brand._id)
 
  return (
    <div className="d-flex justify-content-center gap-1">
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Editar marca"
        onClick={() => setShowEdit(true)}
        tabIndex={0}
      >
        <BsPencil size={16} />
      </button>
      {/**AQUI VA EL MODAL */}
      {brand.isActive ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar marca"
          onClick={(e) => {
            e.preventDefault();
            onToggleStatus(brand);
          }}
          tabIndex={0}
        >
          <FiTrash2 size={16} />
        </button>
      ) : (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Activar marca"
          onClick={(e) => {
            e.preventDefault();
            onToggleStatus(brand);
          }}
          tabIndex={0}
        >
          <BsCheck2 size={16} />
        </button>
      )}
    </div>
  );
};