import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  getAllChildrenIds,
  getAllDescendantIds,
  TreeNodeWithChildren,
} from "../helpers";
import { TreeNode } from "../types";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  const checkboxRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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
    const isIndeterminate = indeterminateNodes.has(node.id);

    return (
      <div key={node.id} style={{ marginLeft: level * 20 }}>
        <div
          className={cn(
            "flex items-center py-1 px-2 rounded cursor-pointer min-h-[32px] hover:bg-muted/50",
            isSelected && "bg-primary/10"
          )}
          onClick={() => handleToggleSelect(node)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 mr-2"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-6 mr-2" />}

          <div className="flex items-center flex-grow gap-2">
            <Checkbox
              checked={isIndeterminate ? "indeterminate" : isSelected}
              onCheckedChange={(checked) => handleToggleSelect(node, checked === true)}
              onClick={(e) => e.stopPropagation()}
              ref={(el) => {
                checkboxRefs.current[node.id] = el;
              }}
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
        className={cn(
          "flex items-center py-1 px-2 rounded cursor-pointer min-h-[32px] hover:bg-muted/50",
          allSelected && "bg-primary/10"
        )}
      >
        <Checkbox
          checked={rootIndeterminate ? "indeterminate" : allSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedNodes(new Set(allSelectableIds));
              onSelectionChange(allSelectableIds);
            } else {
              setSelectedNodes(new Set());
              onSelectionChange([]);
            }
          }}
          className="mr-2"
        />
        <span className="text-sm">{node.text}</span>
      </div>
      {node.children && node.children.map((child) => renderNode(child, 1))}
    </div>
  );

  return (
    <ScrollArea className="h-[400px] border rounded-md p-3">
      {treeStructure.length > 0 && treeStructure[0].id === "root"
        ? renderRoot(treeStructure[0])
        : treeStructure.map((node) => renderNode(node))}
    </ScrollArea>
  );
};

export default CustomTree;
