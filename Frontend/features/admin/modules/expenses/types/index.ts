export interface User {
  _id: string;
  username: string;
  email: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
  };
}

export interface Branch {
  _id: string;
  branchName: string;
  branchCode: string;
}

export interface CashRegister {
  _id: string;
  name: string;
  currentBalance: number;
}

export interface ExpenseConcept {
  _id: string;
  name: string;
  description?: string;
  department: string;
}

export interface Expense {
  _id: string;
  paymentDate: string;
  user: User;
  folio: number;
  concept: ExpenseConcept;
  total: number;
  expenseType: "check_transfer" | "petty_cash";
  branch: Branch;
  cashRegister?: CashRegister;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  paymentDate: string;
  concept: string;
  total: number;
  expenseType: "check_transfer" | "petty_cash";
  cashRegisterId?: string;
  branchId?: string; // ID de la sucursal seleccionada (para administradores)
}

export interface UpdateExpenseData {
  paymentDate?: string;
  concept?: string;
  total?: number;
  expenseType?: "check_transfer" | "petty_cash";
  cashRegisterId?: string;
}

export interface GetExpensesResponse {
  success: boolean;
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  expenseType?: "check_transfer" | "petty_cash";
  startDate?: string;
  endDate?: string;
  branchId?: string;
}
