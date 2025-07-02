"use client";

import React from "react";
import { Card } from "react-bootstrap";
import { useUserVisibility } from "../hooks/useUserVisibility";
import CustomTree from "./CustomTree";

interface UserVisibilityTreeProps {
  userId: string;
}

const UserVisibilityTree: React.FC<UserVisibilityTreeProps> = ({ userId }) => {
  const { loading, treeData, handleSelectionChange } =
    useUserVisibility(userId);

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2">Cargando visibilidad del usuario...</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h4 className="card-title">Visibilidad del Usuario</h4>
        <p className="text-muted mb-0">
          Selecciona las razones sociales, marcas y sucursales a las que este
          usuario tendrá acceso. Si no seleccionas ninguna, el usuario tendrá
          acceso total.
        </p>
      </Card.Header>
      <Card.Body>
        {treeData.length > 0 ? (
          <CustomTree
            data={treeData}
            onSelectionChange={handleSelectionChange}
          />
        ) : (
          <div className="text-center py-4">
            <p className="text-muted">
              No hay datos de visibilidad disponibles
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserVisibilityTree;
