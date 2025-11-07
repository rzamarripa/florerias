export interface ExpenseConcept {
  _id: string;
  name: string;
  description?: string;
  department: "sales" | "administration" | "operations" | "marketing" | "finance" | "human_resources" | "other";
  branch: {
    _id: string;
    branchName: string;
    branchCode?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseConceptData {
  name: string;
  description?: string;
  department: "sales" | "administration" | "operations" | "marketing" | "finance" | "human_resources" | "other";
  branch: string;
}

export interface UpdateExpenseConceptData extends CreateExpenseConceptData {}
