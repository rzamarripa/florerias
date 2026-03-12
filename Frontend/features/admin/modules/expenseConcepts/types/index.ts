export interface ExpenseConcept {
  _id: string;
  name: string;
  description?: string;
  department: "sales" | "administration" | "operations" | "marketing" | "finance" | "human_resources" | "other";
  company?: {
    _id: string;
    companyName: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseConceptData {
  name: string;
  description?: string;
  department: "sales" | "administration" | "operations" | "marketing" | "finance" | "human_resources" | "other";
}

export interface UpdateExpenseConceptData {
  name: string;
  description?: string;
  department: "sales" | "administration" | "operations" | "marketing" | "finance" | "human_resources" | "other";
}
