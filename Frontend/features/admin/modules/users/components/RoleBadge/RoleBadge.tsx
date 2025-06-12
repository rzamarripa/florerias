import React from "react";
import styles from "./RoleBadge.module.css";

interface RoleBadgeProps {
  role?: { name: string };
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getRoleClass = (roleName?: string): string => {
    switch (roleName) {
      case "SuperAdmin":
      case "Super Admin":
        return styles.superAdmin;
      case "Gerente":
        return styles.gerente;
      case "Egresos":
        return styles.egresos;
      case "Sin rol":
        return styles.sinRol;
      default:
        return styles.default;
    }
  };

  return (
    <span className={`${styles.badge} ${getRoleClass(role?.name)}`}>
      {role?.name || "Sin rol"}
    </span>
  );
};

export default RoleBadge;
