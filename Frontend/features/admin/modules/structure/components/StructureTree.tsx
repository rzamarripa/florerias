"use client";

import React from "react";
import { Alert } from "react-bootstrap";
import { StructureTreeNode } from "../types";
import StructureNode from "./StructureNode";

interface StructureTreeProps {
  data: StructureTreeNode[];
  onElementAdded: () => void;
}

const StructureTree: React.FC<StructureTreeProps> = ({
  data,
  onElementAdded,
}) => {
  if (!data || data.length === 0) {
    return (
      <Alert variant="info" className="text-center py-4">
        <div className="mb-3">
          <i className="bi bi-diagram-3 fs-1 text-muted"></i>
        </div>
        <p className="mb-0 text-muted">
          No hay datos de estructura disponibles
        </p>
      </Alert>
    );
  }

  return (
    <div className="border rounded p-3 overflow-auto">
      {data.map((node) => (
        <StructureNode
          key={node.id}
          node={node}
          onElementAdded={onElementAdded}
        />
      ))}
    </div>
  );
};

export default StructureTree;
