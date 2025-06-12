import { Eye, Lock, MoreVertical, RefreshCcw, SquarePen } from "lucide-react";
import React, { useEffect, useState } from "react";
import { type User } from "../../services/users";
import styles from "./ActionsDropdown.module.css";

interface ActionsDropdownProps {
  user: User;
  onEdit: (userId: string) => void;
  onToggleStatus: (user: User) => Promise<void>;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  user,
  onEdit,
  onToggleStatus,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  }>({ top: 0, right: 0 });

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
    }

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    if (!isOpen) {
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = rect.bottom + 5;
      let right = viewportWidth - rect.right;

      if (top + 200 > viewportHeight) {
        top = rect.top - 200;
      }

      if (right < 0) {
        right = 10;
      }

      setDropdownPosition({ top, right });
    }
    setIsOpen(!isOpen);
  };

  const handleAction = async (action: string): Promise<void> => {
    setIsOpen(false);

    try {
      switch (action) {
        case "Ver detalles":
          break;
        case "Editar":
          onEdit(user._id);
          break;
        case "Cambiar rol":
          console.log("Cambiar rol usuario:", user.username);
          break;
        case "Desactivar":
        case "Activar":
          await onToggleStatus(user);
          break;
        default:
          console.log(`${action} usuario:`, user.username);
      }
    } catch (err) {
      console.error("Error en acción:", err);
    }
  };

  return (
    <>
      <div className={styles.dropdownContainer}>
        <button className={styles.toggleButton} onClick={handleToggle}>
          <MoreVertical size={16} className={styles.toggleIcon} />
        </button>
      </div>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div
            className={styles.dropdownMenu}
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <h6 className={styles.dropdownHeader}>Acciones</h6>
            <button
              className={styles.dropdownItem}
              onClick={() => handleAction("Ver detalles")}
            >
              <Eye className={styles.itemIcon} />
              Ver Detalles
            </button>
            <button
              className={styles.dropdownItem}
              onClick={() => handleAction("Editar")}
            >
              <SquarePen className={styles.itemIcon} />
              Editar Usuario
            </button>
            <button
              className={styles.dropdownItem}
              onClick={() => handleAction("Cambiar rol")}
            >
              <RefreshCcw className={styles.itemIcon} />
              Cambiar Rol
            </button>
            <div className={styles.dropdownDivider} />
            <button
              className={`${styles.dropdownItem} ${
                user.profile.estatus ? styles.dangerItem : styles.successItem
              }`}
              onClick={() =>
                handleAction(user.profile.estatus ? "Desactivar" : "Activar")
              }
            >
              <Lock className={styles.itemIcon} />
              {user.profile.estatus ? "Desactivar" : "Activar"}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default ActionsDropdown;
