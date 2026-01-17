"use client";

import React from "react";
import { Edit, Eye, Award, Gift, MoreVertical } from "lucide-react";
import { Client } from "../types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(client)} className="gap-2">
          <Eye className="h-4 w-4" />
          Ver Detalles
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onEdit(client)} className="gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onViewPoints(client)} className="gap-2">
          <Award className="h-4 w-4 text-blue-500" />
          Ver Historial de Puntos
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onViewRewards(client)} className="gap-2">
          <Gift className="h-4 w-4 text-green-500" />
          Ver Recompensas Reclamadas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClientActions;
