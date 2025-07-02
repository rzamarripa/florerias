import jQuery from "jquery";

declare global {
  interface JQuery {
    jstree(command?: string | any, ...args: any[]): any;
  }
}

if (typeof window !== "undefined") {
  (window as any).$ = (window as any).jQuery = jQuery;
}

export interface VisibilityStructure {
  companies: Record<string, any>;
  selectedCompanies: string[];
  selectedBrands: string[];
  selectedBranches: string[];
  brands?: any[];
  branches?: any[];
}

export interface JsTreeData {
  node?: any;
  selected: string[];
  action: string;
  selected_node?: any;
}

export interface TreeNode {
  id: string;
  text: string;
  parent: string;
  type?: string;
  state?: {
    opened?: boolean;
    selected?: boolean;
  };
}
