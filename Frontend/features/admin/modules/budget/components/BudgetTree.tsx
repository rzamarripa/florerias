"use client";

import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { BudgetTreeNode } from "../types";
import BudgetNode from "./BudgetNode";

interface BudgetTreeProps {
  data: BudgetTreeNode[];
  onUpdateBudget: (
    node: BudgetTreeNode,
    newAmount: number
  ) => Promise<void> | void;
}

const BudgetTree: React.FC<BudgetTreeProps> = ({ data, onUpdateBudget }) => {
  const [savingNodeId, setSavingNodeId] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <Alert variant="info" className="text-center py-4">
        <div className="mb-3">
          <i className="bi bi-graph-up fs-1 text-muted"></i>
        </div>
        <p className="mb-0 text-muted">
          No hay datos de presupuesto disponibles para este período
        </p>
      </Alert>
    );
  }

  const handleUpdateBudget = async (
    node: BudgetTreeNode,
    newAmount: number
  ) => {
    setSavingNodeId(node.id);
    await onUpdateBudget(node, newAmount);
    setSavingNodeId(null);
  };

  return (
    <div className="border rounded p-3" style={{ overflowY: "auto" }}>
      {data.map((node) => (
        <BudgetNode
          key={node.id}
          node={node}
          onUpdateBudget={handleUpdateBudget}
          savingNodeId={savingNodeId}
        />
      ))}
    </div>
  );
};

export default BudgetTree;
