import { TreeNode } from "../types";

export interface TreeNodeWithChildren extends TreeNode {
  children?: TreeNodeWithChildren[];
  isExpanded?: boolean;
}

export const getAllDescendantIds = (node: TreeNodeWithChildren): string[] => {
  let ids: string[] = [node.id];
  if (node.children) {
    node.children.forEach((child) => {
      ids = ids.concat(getAllDescendantIds(child));
    });
  }
  return ids;
};

export const getAllChildrenIds = (node: TreeNodeWithChildren): string[] => {
  let ids: string[] = [];
  if (node.children) {
    node.children.forEach((child) => {
      ids.push(child.id);
      ids = ids.concat(getAllChildrenIds(child));
    });
  }
  return ids;
};
