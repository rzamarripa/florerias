export interface VisibilityStructure {
  companies: Record<string, any>;
  selectedCompanies: string[];
  selectedBrands: string[];
  selectedBranches: string[];
  brands?: any[];
  branches?: any[];
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
