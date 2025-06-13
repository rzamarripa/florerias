import { Button, ButtonGroup } from "react-bootstrap";
import { BsCheck2, BsEye, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { type User } from "../../services/users";
import styles from "./Actions.module.css";

interface ActionsProps {
  user: User;
  onEdit: (userId: string) => void;
  onToggleStatus: (user: User) => Promise<void>;
}

export const Actions = ({ user, onEdit, onToggleStatus }: ActionsProps) => (
  <ButtonGroup className={styles.actionsGroup}>
    <Button
      variant="light"
      size="sm"
      title="Ver usuario"
      className={styles.actionBtn}
      tabIndex={0}
    >
      <BsEye size={20} className="text-secondary" />
    </Button>
    <Button
      variant="light"
      size="sm"
      title="Editar usuario"
      className={styles.actionBtn}
      onClick={() => onEdit(user._id)}
      tabIndex={0}
    >
      <BsPencil size={20} className="text-primary" />
    </Button>
    {user.profile.estatus ? (
      <Button
        variant="light"
        size="sm"
        title="Desactivar usuario"
        className={styles.actionBtn}
        onClick={() => onToggleStatus(user)}
        tabIndex={0}
      >
        <FiTrash2 size={20} className="text-danger" />
      </Button>
    ) : (
      <Button
        variant="light"
        size="sm"
        title="Activar usuario"
        className={styles.actionBtn}
        onClick={() => onToggleStatus(user)}
        tabIndex={0}
      >
        <BsCheck2 size={20} className="text-success" />
      </Button>
    )}
  </ButtonGroup>
);
