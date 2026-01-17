import React from "react";
import { Edit, Power, PowerOff, MoreVertical } from "lucide-react";
import { Production } from "../types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionsProps {
  production: Production;
  onEdit: (production: Production) => void;
  onToggleStatus: (production: Production) => void;
}

const Actions: React.FC<ActionsProps> = ({ production, onEdit, onToggleStatus }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(production)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onToggleStatus(production)}
          className={production.estatus ? "text-destructive" : "text-green-600"}
        >
          {production.estatus ? (
            <>
              <PowerOff className="h-4 w-4 mr-2" />
              Desactivar
            </>
          ) : (
            <>
              <Power className="h-4 w-4 mr-2" />
              Activar
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
