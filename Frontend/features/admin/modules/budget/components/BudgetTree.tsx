"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import { BudgetTreeNode } from "../types";

interface TreeNodeWithChildren extends BudgetTreeNode {
  children?: TreeNodeWithChildren[];
  isExpanded?: boolean;
}

interface BudgetTreeProps {
  data: BudgetTreeNode[];
  selectedMonth: string;
  budgetAmounts: Record<string, number>;
  pendingChanges: Record<string, number>;
  onInputChange: (nodeId: string, value: number) => void;
}

const BudgetTree: React.FC<BudgetTreeProps> = ({
  data,
  selectedMonth,
  budgetAmounts,
  pendingChanges,
  onInputChange,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialExpanded = new Set<string>();
    data.forEach((node) => {
      if (node.state?.opened) {
        initialExpanded.add(node.id);
      }
    });
    setExpandedNodes(initialExpanded);
  }, [data]);

  const buildTreeStructure = (
    nodes: BudgetTreeNode[]
  ): TreeNodeWithChildren[] => {
    const nodeMap = new Map<string, TreeNodeWithChildren>();
    const rootNodes: TreeNodeWithChildren[] = [];

    nodes.forEach((node) => {
      nodeMap.set(node.id, {
        ...node,
        children: [],
        isExpanded: expandedNodes.has(node.id),
      });
    });

    nodes.forEach((node) => {
      const nodeWithChildren = nodeMap.get(node.id)!;

      if (node.parent === "#") {
        rootNodes.push(nodeWithChildren);
      } else {
        const parent = nodeMap.get(node.parent);
        if (parent) {
          parent.children!.push(nodeWithChildren);
        } else {
          console.warn(
            "[BudgetTree] buildTreeStructure - Padre no encontrado para:",
            node.id,
            "parent:",
            node.parent
          );
        }
      }
    });

    return rootNodes;
  };

  const treeStructure = useMemo(() => {
    const result = buildTreeStructure(data);
    return result;
  }, [data, expandedNodes]);

  const handleToggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const isEditableNode = (node: TreeNodeWithChildren): boolean => {
    const isRouteEditable = node.type === "route";
    const isBranchEditable = node.type === "branch" && !node.hasRoutes;

    // Log para depuración de nodos editables
    if (node.type === "route" || node.type === "branch") {
      console.log(
        `[BudgetTree] isEditableNode - ${node.type} "${node.text}":`,
        {
          type: node.type,
          hasRoutes: node.hasRoutes,
          isRouteEditable,
          isBranchEditable,
          finalResult: isRouteEditable || isBranchEditable,
          nodeData: node.data,
        }
      );
    }

    if (isRouteEditable) return true;
    if (isBranchEditable) return true;
    return false;
  };

  const calculateParentTotal = (node: TreeNodeWithChildren): number => {
    if (!node.children || node.children.length === 0) {
      const currentAmount =
        pendingChanges[node.id] ?? budgetAmounts[node.id] ?? 0;
      return currentAmount;
    }

    return node.children.reduce((total, child) => {
      return total + calculateParentTotal(child);
    }, 0);
  };

  const getDisplayAmount = (node: TreeNodeWithChildren): number => {
    if (isEditableNode(node)) {
      const amount = pendingChanges[node.id] ?? budgetAmounts[node.id] ?? 0;
      return amount;
    }
    return calculateParentTotal(node);
  };

  const handleInputChange = (nodeId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    onInputChange(nodeId, numericValue);
  };

  const getNodeIcon = (node: TreeNodeWithChildren): string => {
    switch (node.type) {
      case "category":
        return "🏢";
      case "company":
        return "🏛️";
      case "branch":
        return "🏪";
      case "brand":
        return "🏷️";
      case "route":
        return "🛣️";
      default:
        return "📁";
    }
  };

  const renderNode = (node: TreeNodeWithChildren, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isEditable = isEditableNode(node);
    const displayAmount = getDisplayAmount(node);
    const showInput = node.type !== "category";

    return (
      <div key={node.id} style={{ marginLeft: level * 20 }}>
        <div
          className="d-flex align-items-center justify-content-between py-2 px-3 rounded"
          style={{
            backgroundColor:
              isEditable && displayAmount > 0 ? "#e8f5e8" : "transparent",
            minHeight: "50px",
            border: "1px solid #dee2e6",
            marginBottom: "2px",
          }}
        >
          <div className="d-flex align-items-center flex-grow-1">
            {hasChildren && (
              <button
                className="btn btn-sm btn-link p-0 me-2"
                onClick={() => handleToggleExpand(node.id)}
                style={{ width: "16px", height: "16px" }}
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            {!hasChildren && <div className="me-4" />}

            <span className="me-2">{getNodeIcon(node)}</span>
            <span className="text-sm fw-medium flex-grow-1">{node.text}</span>

            {!isEditable && displayAmount === 0 && showInput && (
              <span className="badge bg-secondary ms-2">Sin presupuesto</span>
            )}
            {isEditable && displayAmount === 0 && (
              <span className="badge bg-warning ms-2">Sin presupuesto</span>
            )}
          </div>

          {showInput && (
            <div
              className="d-flex align-items-center"
              style={{ minWidth: "200px", justifyContent: "flex-end" }}
            >
              <span className="me-2 text-muted" style={{ fontSize: "0.8rem" }}>
                $
              </span>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={displayAmount.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(node.id, e.target.value)
                }
                disabled={!isEditable}
                size="sm"
                style={{
                  width: "120px",
                  textAlign: "right",
                  backgroundColor: isEditable ? "white" : "#f8f9fa",
                  color: isEditable ? "black" : "#6c757d",
                }}
                placeholder="0.00"
              />
              {!isEditable && <span className="ms-2 badge bg-info">Total</span>}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!selectedMonth) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">
          Selecciona un mes para ver el árbol de presupuesto
        </p>
      </div>
    );
  }

  return (
    <div
      className="border rounded p-3"
      style={{ maxHeight: "600px", overflowY: "auto" }}
    >
      {treeStructure.length > 0 ? (
        treeStructure.map((node) => renderNode(node))
      ) : (
        <div className="text-center py-4">
          <p className="text-muted">No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
};

export default BudgetTree;
