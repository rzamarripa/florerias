import { BsCheck2, BsEye } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { Role } from "../../roles/services/role";
import { type User } from "../services/users";
import UserModal from "./UserModal";

interface ActionsProps {
  user: User;
  roles: Role[];
  onToggleStatus: (user: User) => Promise<void>;
  onUserUpdated?: () => void; // Callback para refrescar la lista después de actualizar
}

export const Actions = ({ 
  user, 
  roles, 
  onToggleStatus, 
  onUserUpdated 
}: ActionsProps) => (
  <div className="d-flex justify-content-center gap-1">
    <button
      className="btn btn-light btn-icon btn-sm rounded-circle"
      title="Ver usuario"
      onClick={(e) => e.preventDefault()}
      tabIndex={0}
    >
      <BsEye size={16} />
    </button>

    {/* Modal de edición - ahora simplificado */}
    <UserModal 
      user={user} 
      roles={roles} 
      onSuccess={onUserUpdated}
    />

    {user.profile.estatus ? (
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Desactivar usuario"
        onClick={(e) => {
          e.preventDefault();
          onToggleStatus(user);
        }}
        tabIndex={0}
      >
        <FiTrash2 size={16} />
      </button>
    ) : (
      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title="Activar usuario"
        onClick={(e) => {
          e.preventDefault();
          onToggleStatus(user);
        }}
        tabIndex={0}
      >
        <BsCheck2 size={16} />
      </button>
    )}
  </div>
);