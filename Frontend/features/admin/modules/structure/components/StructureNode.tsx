"use client";

import React, { useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import { StructureTreeNode } from "../types";
import StructureBrandModal from "./StructureBrandModal";
import StructureBranchModal from "./StructureBranchModal";
import StructureRouteModal from "./StructureRouteModal";

interface StructureNodeProps {
  node: StructureTreeNode;
  onElementAdded: () => void;
  level?: number;
  savingNodeId?: string | null;
}

const StructureNode: React.FC<StructureNodeProps> = ({
  node,
  onElementAdded,
  level = 0,
  savingNodeId,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddElement = () => {
    if (node.canAdd && node.addType) {
      switch (node.addType) {
        case "brand":
          setShowBrandModal(true);
          break;
        case "branch":
          setShowBranchModal(true);
          break;
        case "route":
          setShowRouteModal(true);
          break;
      }
    }
  };

  const handleModalClose = () => {
    setShowBrandModal(false);
    setShowBranchModal(false);
    setShowRouteModal(false);
  };

  const handleElementSaved = () => {
    handleModalClose();
    onElementAdded();
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
            <Badge bg="secondary" className="me-3">
              {node.type === "category"
                ? "Categoría"
                : node.type === "company"
                ? "Empresa"
                : node.type === "brand"
                ? "Marca"
                : node.type === "branch"
                ? "Sucursal"
                : "Ruta"}
            </Badge>

            {node.canAdd && (
              <Button
                variant="link"
                size="sm"
                onClick={handleAddElement}
                className="d-flex align-items-center gap-1 text-primary p-1"
                style={{ fontSize: "12px" }}
              >
                <Plus size={14} />
                {node.addType === "brand"
                  ? "Agregar Marca"
                  : node.addType === "branch"
                  ? "Agregar Sucursal"
                  : "Agregar Ruta"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div>
          {hasChildren &&
            node.children!.map((child) => (
              <StructureNode
                key={child.id}
                node={child}
                onElementAdded={onElementAdded}
                level={level + 1}
                savingNodeId={savingNodeId}
              />
            ))}
        </div>
      )}

      {/* Modales para agregar elementos */}
      <StructureBrandModal
        show={showBrandModal}
        onHide={handleModalClose}
        onBrandSaved={handleElementSaved}
        categoryId={node.entityData.categoryId || ""}
        companyId={
          node.type === "company"
            ? node.entityData._id
            : node.entityData.companyId || ""
        }
        branchId=""
      />

      <StructureBranchModal
        show={showBranchModal}
        onHide={handleModalClose}
        onBranchSaved={handleElementSaved}
        companyId={node.entityData.companyId || ""}
        brandId={node.type === "brand" ? node.entityData._id : ""}
      />

      <StructureRouteModal
        show={showRouteModal}
        onHide={handleModalClose}
        onRouteSaved={handleElementSaved}
        categoryId={node.entityData.categoryId || ""}
        companyId={node.entityData.companyId || ""}
        brandId={node.entityData.brandId || ""}
        branchId={node.type === "branch" ? node.entityData._id : ""}
      />
    </div>
  );
};

export default StructureNode;
