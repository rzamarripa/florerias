import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { Role, User } from "../types";
import UserModal from "./UserModal";
import UserViewModal from "./UserViewModal";

interface ActionsProps {
  user: User;
  roles: Role[];
  onToggleStatus: (user: User) => Promise<void>;
  onUserUpdated?: () => void;
}

export const Actions = ({
  user,
  roles,
  onToggleStatus,
  onUserUpdated,
}: ActionsProps) => (
  <div className="d-flex justify-content-center gap-1">
    <UserViewModal user={user} />

    <UserModal user={user} roles={roles} onSuccess={onUserUpdated} />

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
