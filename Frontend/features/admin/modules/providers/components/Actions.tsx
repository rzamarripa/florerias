import React, { useState } from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import ProviderModal from "./ProviderModal";
import { Provider } from "../types";
import { deleteProvider, activateProvider } from "../services/providers";
import { toast } from "react-toastify";

interface ActionsProps {
  proveedor: Provider;
  onProveedorSaved: () => void;
}

const Actions: React.FC<ActionsProps> = ({ proveedor, onProveedorSaved }) => {
  const [loading, setLoading] = useState(false);

  const handleToggleProveedor = async () => {
    setLoading(true);
    try {
      let res;
      if (proveedor.isActive) {
        res = await deleteProvider(proveedor._id);
        if (res.success) {
          toast.success("Proveedor desactivado");
        } else {
          toast.error(res.message || "Error al desactivar proveedor");
        }
      } else {
        res = await activateProvider(proveedor._id);
        if (res.success) {
          toast.success("Proveedor activado");
        } else {
          toast.error(res.message || "Error al activar proveedor");
        }
      }
      onProveedorSaved();
    } catch {
      toast.error("Error en la operación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <ProviderModal mode="edit" editingProveedor={proveedor} onProveedorSaved={onProveedorSaved} />
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title={proveedor.isActive ? "Desactivar proveedor" : "Activar proveedor"}
        onClick={handleToggleProveedor}
        disabled={loading}
      >
        {proveedor.isActive ? <FiTrash2 size={16} /> : <BsCheck2 size={16} />}
      </button>
    </div>
  );
};

export default Actions; 