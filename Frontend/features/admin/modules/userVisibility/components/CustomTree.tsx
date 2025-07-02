import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getAllChildrenIds,
  getAllDescendantIds,
  TreeNodeWithChildren,
} from "../helpers";
import { TreeNode } from "../types";

interface CustomTreeProps {
  data: TreeNode[];
  onSelectionChange: (selectedNodes: string[]) => void;
}

const CustomTree: React.FC<CustomTreeProps> = ({ data, onSelectionChange }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [indeterminateNodes, setIndeterminateNodes] = useState<Set<string>>(
    new Set()
  );
  const checkboxRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    const initialSelected = new Set<string>();
    const initialExpanded = new Set<string>();

    data.forEach((node) => {
      if (node.state?.selected) {
        initialSelected.add(node.id);
      }
      if (node.state?.opened) {
        initialExpanded.add(node.id);
      }
    });

    setSelectedNodes(initialSelected);
    setExpandedNodes(initialExpanded);
  }, [data]);

  useEffect(() => {
    indeterminateNodes.forEach((id) => {
      if (checkboxRefs.current[id]) {
        checkboxRefs.current[id]!.indeterminate = true;
      }
    });
    Object.keys(checkboxRefs.current).forEach((id) => {
      if (!indeterminateNodes.has(id) && checkboxRefs.current[id]) {
        checkboxRefs.current[id]!.indeterminate = false;
      }
    });
  }, [indeterminateNodes, selectedNodes]);

  const buildTreeStructure = (nodes: TreeNode[]): TreeNodeWithChildren[] => {
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
        }
      }
    });

    return rootNodes;
  };

  const updateIndeterminateStates = (
    tree: TreeNodeWithChildren[],
    selected: Set<string>
  ) => {
    const indeterminate = new Set<string>();
    const nodeMap = new Map<string, TreeNodeWithChildren>();
    const fillMap = (node: TreeNodeWithChildren) => {
      nodeMap.set(node.id, node);
      node.children?.forEach(fillMap);
    };
    tree.forEach(fillMap);

    const checkIndeterminate = (node: TreeNodeWithChildren): boolean => {
      if (!node.children || node.children.length === 0)
        return selected.has(node.id);
      let selectedCount = 0;
      let childIndeterminate = false;
      node.children.forEach((child) => {
        if (checkIndeterminate(child)) selectedCount++;
        if (indeterminate.has(child.id)) childIndeterminate = true;
      });
      if (selectedCount === 0) return false;
      if (selectedCount === node.children.length && !childIndeterminate)
        return true;
      indeterminate.add(node.id);
      return true;
    };
    tree.forEach(checkIndeterminate);
    return indeterminate;
  };

  const treeStructure = useMemo(
    () => buildTreeStructure(data),
    [data, expandedNodes]
  );

  useEffect(() => {
    setIndeterminateNodes(
      updateIndeterminateStates(treeStructure, selectedNodes)
    );
  }, [selectedNodes, treeStructure]);

  const handleToggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleToggleSelect = (
    node: TreeNodeWithChildren,
    checked?: boolean
  ) => {
    const newSelected = new Set(selectedNodes);
    const allDescendants = getAllDescendantIds(node);
    if (checked === undefined) checked = !selectedNodes.has(node.id);
    if (checked) {
      allDescendants.forEach((id) => newSelected.add(id));
    } else {
      allDescendants.forEach((id) => newSelected.delete(id));
    }
    const nodeMap = new Map<string, TreeNodeWithChildren>();
    const fillMap = (n: TreeNodeWithChildren) => {
      nodeMap.set(n.id, n);
      n.children?.forEach(fillMap);
    };
    treeStructure.forEach(fillMap);
    let parentId = node.parent;
    while (parentId && parentId !== "#") {
      const parent = nodeMap.get(parentId);
      if (parent) {
        const allChildren = getAllChildrenIds(parent);
        if (allChildren.every((id) => newSelected.has(id))) {
          newSelected.add(parent.id);
        } else {
          newSelected.delete(parent.id);
        }
        parentId = parent.parent;
      } else {
        break;
      }
    }
    setSelectedNodes(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const getAllSelectableIds = (nodes: TreeNodeWithChildren[]): string[] => {
    let ids: string[] = [];
    nodes.forEach((node) => {
      if (node.id !== "root") ids.push(node.id);
      if (node.children) ids = ids.concat(getAllSelectableIds(node.children));
    });
    return ids;
  };

  const allSelectableIds = useMemo(
    () => getAllSelectableIds(treeStructure),
    [treeStructure]
  );
  const allSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selectedNodes.has(id));
  const someSelected = allSelectableIds.some((id) => selectedNodes.has(id));
  const rootIndeterminate = someSelected && !allSelected;

  const renderNode = (node: TreeNodeWithChildren, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodes.has(node.id);

    return (
      <div key={node.id} style={{ marginLeft: level * 20 }}>
        <div
          className="d-flex align-items-center py-1 px-2 rounded cursor-pointer"
          style={{
            backgroundColor: isSelected ? "#e3f2fd" : "transparent",
            cursor: "pointer",
            minHeight: "32px",
          }}
          onClick={() => handleToggleSelect(node)}
        >
          {hasChildren && (
            <button
              className="btn btn-sm btn-link p-0 me-2"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node.id);
              }}
              style={{ width: "16px", height: "16px" }}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          {!hasChildren && <div className="me-4" />}

          <div className="d-flex align-items-center flex-grow-1">
            <input
              type="checkbox"
              checked={isSelected}
              ref={(el) => {
                checkboxRefs.current[node.id] = el;
              }}
              onChange={(e) => handleToggleSelect(node, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="me-2"
            />
            <span className="text-sm">{node.text}</span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderRoot = (node: TreeNodeWithChildren) => (
    <div key={node.id}>
      <div
        className="d-flex align-items-center py-1 px-2 rounded cursor-pointer"
        style={{
          backgroundColor: allSelected ? "#e3f2fd" : "transparent",
          cursor: "pointer",
          minHeight: "32px",
        }}
      >
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = rootIndeterminate;
          }}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedNodes(new Set(allSelectableIds));
              onSelectionChange(allSelectableIds);
            } else {
              setSelectedNodes(new Set());
              onSelectionChange([]);
            }
          }}
          className="me-2"
        />
        <span className="text-sm">{node.text}</span>
      </div>
      {node.children && node.children.map((child) => renderNode(child, 1))}
    </div>
  );

  return (
    <div
      className="border rounded p-3"
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      {treeStructure.length > 0 && treeStructure[0].id === "root"
        ? renderRoot(treeStructure[0])
        : treeStructure.map((node) => renderNode(node))}
    </div>
  );
};

export default CustomTree;
