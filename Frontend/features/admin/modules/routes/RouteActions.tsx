import React, { useState } from "react";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { routeService } from "./services/routeService";
import { Route } from "./types";

interface RouteActionsProps {
  route: Route;
  onRouteSaved?: () => void;
  onEdit?: (route: Route) => void;
}

const RouteActions: React.FC<RouteActionsProps> = ({ route, onRouteSaved, onEdit }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta ruta?")) {
      return;
    }
    try {
      setIsToggling(true);
      const response = await routeService.deleteRoute(route._id);
      if (response.success) {
        toast.success("Ruta eliminada correctamente");
        onRouteSaved?.();
      } else {
        toast.error(response.message || "Error al eliminar ruta");
      }
    } catch (error: any) {
      toast.error(
        "Error al eliminar ruta: " + (error.message || "Error desconocido")
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(route);
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Editar"
        onClick={handleEdit}
        disabled={isToggling}
      >
        <FiEdit2 size={16} />
      </button>
      <button
        className={
          "btn btn-light btn-icon btn-sm rounded-circle" +
          (isToggling ? " disabled" : "")
        }
        title={isToggling ? "Eliminando..." : "Eliminar ruta"}
        onClick={handleDelete}
        disabled={isToggling}
      >
        {isToggling ? (
          <Spinner animation="border" size="sm" style={{ width: "16px", height: "16px" }} />
        ) : (
          <FiTrash2 size={16} />
        )}
      </button>
    </div>
  );
};

export default RouteActions; 