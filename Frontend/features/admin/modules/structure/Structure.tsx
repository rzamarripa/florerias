"use client";

import {
  UserSessionStore,
  useUserSessionStore,
} from "@/stores/userSessionStore";
import React, { useEffect, useState } from "react";
import { Card, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import StructureTree from "./components/StructureTree";
import { structureService } from "./services/structureService";
import { StructureTreeNode } from "./types";

const Structure: React.FC = () => {
  const [treeData, setTreeData] = useState<StructureTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useUserSessionStore((state: UserSessionStore) => state.user);

  useEffect(() => {
    loadStructureTree();
  }, [user]);

  const loadStructureTree = async () => {
    setLoading(true);
    try {
      const data = await structureService.getStructureTree(user?._id);
      setTreeData(data);
    } catch (error: any) {
      toast.error(
        `Error al cargar la estructura organizacional: ${
          error.message || error
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header className="p-3 w-100">
        <div className="d-flex align-items-center justify-content-between w-100">
          <h5 className="card-title">Estructura Organizacional</h5>
          <div className="d-flex align-items-center gap-2">
            <small className="text-muted">
              Haz clic en "Agregar" para crear nuevas marcas, sucursales o rutas
            </small>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p>Cargando estructura...</p>
          </div>
        ) : (
          <StructureTree data={treeData} onElementAdded={loadStructureTree} />
        )}
      </Card.Body>
    </Card>
  );
};

export default Structure;
