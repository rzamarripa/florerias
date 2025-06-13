import { BsCheck2, BsEye, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { type User } from "../services/users";

interface ActionsProps {
  user: User;
  onEdit: (userId: string) => void;
  onToggleStatus: (user: User) => Promise<void>;
}

export const Actions = ({ user, onEdit, onToggleStatus }: ActionsProps) => (
  <div className="d-flex justify-content-center gap-1">
    <button
      className="btn btn-light btn-icon btn-sm rounded-circle"
      title="Ver usuario"
      onClick={(e) => e.preventDefault()}
      tabIndex={0}
    >
      <BsEye size={16} />
    </button>
    <button
      className="btn btn-light btn-icon btn-sm rounded-circle"
      title="Editar usuario"
      onClick={(e) => {
        e.preventDefault();
        onEdit(user._id);
      }}
      tabIndex={0}
    >
      <BsPencil size={16} />
    </button>
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
