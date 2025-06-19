import { PackageSearch, Store } from "lucide-react";
import React, { useState } from "react";
import { Spinner } from "react-bootstrap";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Role } from "../../roles/types";
import { usersService } from "../services/users";
import { User } from "../types";
import UserModal from "./UserModal";
import UserProvidersList from "./UserProvidersList";
import UserProvidersModal from "./UserProvidersModal";

interface UserActionsProps {
  user: User;
  onUserSaved?: () => void;
  roles: Role[];
}

const UserActions: React.FC<UserActionsProps> = ({
  user,
  onUserSaved,
  roles,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showProvidersList, setShowProvidersList] = useState<boolean>(false);

  const handleToggleUser = async (id: string, currentStatus: boolean) => {
    try {
      setIsToggling(true);
      let response;
      if (currentStatus) {
        response = await usersService.deleteUser(id);
      } else {
        response = await usersService.activateUser(id);
      }
      if (response) {
        const action = currentStatus ? "desactivado" : "activado";
        toast.success(`Usuario ${action} correctamente`);
        onUserSaved?.();
      }
    } catch (error: any) {
      console.error("Error toggling user:", error);
      let errorMessage = `Error al ${
        user.profile.estatus ? "desactivar" : "activar"
      } el usuario`;
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.response?.status === 404) {
        errorMessage = "Usuario no encontrado";
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
      return user.profile.estatus ? "Desactivando..." : "Activando...";
    }
    return user.profile.estatus ? "Desactivar usuario" : "Activar usuario";
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
      <UserModal user={user} roles={roles} onSuccess={onUserSaved} />

      <button
        className={getToggleButtonClass()}
        title={getToggleButtonTitle()}
        onClick={() => handleToggleUser(user._id, user.profile.estatus)}
        disabled={isToggling}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : user.profile.estatus ? (
          <FiTrash2 size={16} />
        ) : (
          <BsCheck2 size={16} />
        )}
      </button>

      <UserProvidersModal
        user={user}
        onProvidersSaved={onUserSaved}
        buttonProps={{
          variant: "light",
          size: "sm",
          className: "btn-icon rounded-circle",
          title: "Asignar proveedores",
        }}
      >
        <Store size={16} />
      </UserProvidersModal>

      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Ver proveedores asignados"
        onClick={() => setShowProvidersList(true)}
      >
        <PackageSearch size={16} />
      </button>

      <UserProvidersList
        user={user}
        show={showProvidersList}
        onClose={() => setShowProvidersList(false)}
      />
    </div>
  );
};

export default UserActions;
