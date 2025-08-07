"use client";

import React, { useState } from "react";
import { Badge } from "react-bootstrap";
import { BudgetTreeNode } from "../types";
import BudgetInput from "./BudgetInput";

interface BudgetNodeProps {
  node: BudgetTreeNode;
  onUpdateBudget: (node: BudgetTreeNode, newAmount: number) => void;
  level?: number;
  savingNodeId?: string | null;
}

const BudgetNode: React.FC<BudgetNodeProps> = ({
  node,
  onUpdateBudget,
  level = 0,
  savingNodeId,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSave = (newAmount: number) => {
    onUpdateBudget(node, newAmount);
  };

  const hasChildren = node.children && node.children.length > 0;

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case "category":
        return "📊";
      case "company":
        return "🏢";
      case "brand":
        return "🏷️";
      case "branch":
        return "🏪";
      case "route":
        return "🚗";
      case "expense_concept":
        return "💰";
      default:
        return "📁";
    }
  };

  return (
    <div style={{ marginLeft: level * 20 }}>
      <div
        className="d-flex align-items-center py-2 px-2 rounded"
        style={{
          minHeight: "40px",
        }}
      >
        {hasChildren && (
          <button
            className="btn btn-sm btn-link p-0 me-2"
            onClick={handleToggle}
            style={{ width: "16px", height: "16px" }}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
        {!hasChildren && <div className="me-4" />}

        <div className="d-flex align-items-center flex-grow-1">
          <span className="me-2 fs-5">{getNodeTypeIcon(node.type)}</span>
          <span className="fw-semibold">{node.text}</span>

          <div className="ms-auto d-flex align-items-center">
            {node.total !== undefined && (
              <Badge bg="primary" className="me-3">
                ${node.total.toLocaleString()}
              </Badge>
            )}

            {node.canAssignBudget && (
              <BudgetInput
                initialAmount={node.budgetAmount || 0}
                onSave={handleSave}
                isSaving={savingNodeId === node.id}
              />
            )}
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <BudgetNode
              key={child.id}
              node={child}
              onUpdateBudget={onUpdateBudget}
              level={level + 1}
              savingNodeId={savingNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetNode;
