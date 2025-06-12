import React from "react";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`${styles.badge} ${status ? styles.active : styles.inactive}`}
    >
      <span className={styles.indicator}>{status ? "🟢" : "🔴"}</span>
      {status ? "Activo" : "Inactivo"}
    </span>
  );
};

export default StatusBadge;
