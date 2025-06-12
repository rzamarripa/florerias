import React from "react";
import styles from "./StatusBadge.module.css";
import { Badge } from "react-bootstrap";

interface StatusBadgeProps {
  status: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <Badge className={`${styles.badge} ${status ? styles.active : styles.inactive}`}>
      {status ? "Activo" : "Inactivo"}
    </Badge>
  );
};

export default StatusBadge;
