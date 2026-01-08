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
  branch?: string; // Se puede enviar vacío para Gerente, el backend lo determina
}

export interface UpdateExpenseConceptData {
  name: string;
  description?: string;
  department: "sales" | "administration" | "operations" | "marketing" | "finance" | "human_resources" | "other";
  // No se actualiza la branch en edición
}
