export interface ExpenseConceptBudget {
  _id: string;
  name: string;
  description: string;
  department: string;
  category: string;
  totalAssigned: number;
  totalPaid: number;
  totalPending: number;
  disponible: number;
}

export interface ExpenseConceptBudgetFilters {
  departmentId?: string;
  month?: string;
}

export interface Department {
  _id: string;
  name: string;
}

export interface ExpenseConcept {
  _id: string;
  name: string;
  description: string;
  departmentId: {
    _id: string;
    name: string;
  };
  categoryId: {
    _id: string;
    name: string;
  };
  isActive: boolean;
}

export interface BudgetByConceptResponse {
  expenseConceptId: string;
  expenseConceptName: string;
  department: string;
  category: string;
  month: string;
  totalAssigned: number;
  budgetCount: number;
}

export interface PaidByConceptResponse {
  expenseConceptId: string;
  expenseConceptName: string;
  department: string;
  category: string;
  month: string;
  totalPaid: number;
  packagesProcessed: number;
  paymentsCount: number;
  paymentDetails: Array<{
    packageId: string;
    packageFolio: number;
    type: "factura" | "efectivo";
    invoiceId?: string;
    cashPaymentId?: string;
    amount: number;
    description: string;
    uuid?: string;
  }>;
}

export interface PendingByConceptResponse {
  expenseConceptId: string;
  expenseConceptName: string;
  department: string;
  category: string;
  month: string;
  totalPending: number;
  packagesProcessed: number;
  paymentsCount: number;
  pendingDetails: Array<{
    packageId: string;
    packageFolio: number;
    packageStatus: string;
    type: "factura" | "efectivo";
    invoiceId?: string;
    cashPaymentId?: string;
    amount: number;
    description: string;
    uuid?: string;
    authorized: boolean | null;
  }>;
} 