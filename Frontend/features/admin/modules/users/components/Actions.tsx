"use client";

import React, { useState } from "react";
import { Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Role } from "../../roles/types";
import { usersService } from "../services/users";
import { User } from "../types";
import UserModal from "./UserModal";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex justify-center gap-1">
      <UserModal user={user} roles={roles} onSuccess={onUserSaved} />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        title={getToggleButtonTitle()}
        onClick={() => handleToggleUser(user._id, user.profile.estatus)}
        disabled={isToggling}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : user.profile.estatus ? (
          <Trash2 className="h-4 w-4 text-destructive" />
        ) : (
          <Check className="h-4 w-4 text-green-600" />
        )}
      </Button>
    </div>
  );
};

export default UserActions;
