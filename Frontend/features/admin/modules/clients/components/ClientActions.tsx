import React from "react";
import { Dropdown } from "react-bootstrap";
import { Edit, Eye, Award, Gift, MoreVertical } from "lucide-react";
import { Client } from "../types";

interface ClientActionsProps {
  client: Client;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onViewPoints: (client: Client) => void;
  onViewRewards: (client: Client) => void;
}

const ClientActions: React.FC<ClientActionsProps> = ({
  client,
  onView,
  onEdit,
  onViewPoints,
  onViewRewards,
}) => {
  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="outline-secondary"
        size="sm"
        className="d-flex align-items-center gap-1 border-0"
        style={{ boxShadow: "none" }}
      >
        <MoreVertical size={16} />
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Item
          onClick={() => onView(client)}
          className="d-flex align-items-center gap-2"
        >
          <Eye size={16} />
          Ver Detalles
        </Dropdown.Item>
        
        <Dropdown.Item
          onClick={() => onEdit(client)}
          className="d-flex align-items-center gap-2"
        >
          <Edit size={16} />
          Editar
        </Dropdown.Item>
        
        <Dropdown.Divider />
        
        <Dropdown.Item
          onClick={() => onViewPoints(client)}
          className="d-flex align-items-center gap-2"
        >
          <Award size={16} className="text-info" />
          Ver Historial de Puntos
        </Dropdown.Item>
        
        <Dropdown.Item
          onClick={() => onViewRewards(client)}
          className="d-flex align-items-center gap-2"
        >
          <Gift size={16} className="text-success" />
          Ver Recompensas Reclamadas
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ClientActions;