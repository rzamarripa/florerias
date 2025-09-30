import React from "react";
import { Button, Dropdown } from "react-bootstrap";
import { Edit, Power, PowerOff, MoreVertical } from "lucide-react";
import { Production } from "../types";

interface ActionsProps {
  production: Production;
  onEdit: (production: Production) => void;
  onToggleStatus: (production: Production) => void;
}

const Actions: React.FC<ActionsProps> = ({ production, onEdit, onToggleStatus }) => {
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
          onClick={() => onEdit(production)}
          className="d-flex align-items-center gap-2"
        >
          <Edit size={16} />
          Editar
        </Dropdown.Item>
        
        <Dropdown.Divider />
        
        <Dropdown.Item
          onClick={() => onToggleStatus(production)}
          className={`d-flex align-items-center gap-2 ${
            production.estatus ? "text-danger" : "text-success"
          }`}
        >
          {production.estatus ? (
            <>
              <PowerOff size={16} />
              Desactivar
            </>
          ) : (
            <>
              <Power size={16} />
              Activar
            </>
          )}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default Actions;