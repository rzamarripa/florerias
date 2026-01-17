"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useUserVisibility } from "../hooks/useUserVisibility";
import CustomTree from "./CustomTree";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserVisibilityTreeProps {
  userId: string;
}

const UserVisibilityTree: React.FC<UserVisibilityTreeProps> = ({ userId }) => {
  const { loading, treeData, handleSelectionChange } =
    useUserVisibility(userId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-muted-foreground">Cargando visibilidad del usuario...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visibilidad del Usuario</CardTitle>
        <CardDescription>
          Selecciona las razones sociales, marcas y sucursales a las que este
          usuario tendrá acceso. Si no seleccionas ninguna, no tendrás ningun tipo de acceso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {treeData.length > 0 ? (
          <CustomTree
            data={treeData}
            onSelectionChange={handleSelectionChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No hay datos de visibilidad disponibles
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserVisibilityTree;
