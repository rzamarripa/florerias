import React from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import ProviderModal from "./ProviderModal";
import { Provider } from "../types";
import { deleteProvider, activateProvider } from "../services/providers";
import { toast } from "react-toastify";

interface ActionsProps {
  provider: Provider;
  onProviderSaved: () => void;
}

const Actions: React.FC<ActionsProps> = ({ provider, onProviderSaved }) => {
  const handleToggleStatus = async () => {
    try {
      if (provider.isActive) {
        const res = await deleteProvider(provider._id);
        if (res.success) {
          toast.success("Proveedor desactivado exitosamente");
          onProviderSaved();
        } else {
          toast.error(res.message || "Error al desactivar proveedor");
        }
      } else {
        const res = await activateProvider(provider._id);
        if (res.success) {
          toast.success("Proveedor activado exitosamente");
          onProviderSaved();
        } else {
          toast.error(res.message || "Error al activar proveedor");
        }
      }
    } catch (error) {
      const action = provider.isActive ? "desactivar" : "activar";
      toast.error(`Error al ${action} el proveedor`);
      console.error(`Error ${action} proveedor:`, error);
    }
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <ProviderModal
        mode="edit"
        editingProvider={provider}
        onProviderSaved={onProviderSaved}
      />

      {provider.isActive ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar proveedor"
          onClick={handleToggleStatus}
          tabIndex={0}
        >
          <FiTrash2 size={16} />
        </button>
      ) : (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Activar proveedor"
          onClick={handleToggleStatus}
          tabIndex={0}
        >
          <BsCheck2 size={16} />
        </button>
      )}
    </div>
  );
};

export default Actions; 