export interface Branch {
  _id: string;
  branchName: string;
  branchCode?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
  };
  role?: {
    _id: string;
    name: string;
  };
}

export interface LastRegistry {
  orderId: {
    _id: string;
    orderNumber: string;
    total: number;
  };
  saleDate: string;
}

export interface Expense {
  _id?: string;
  expenseConcept: string;
  amount: number;
  expenseDate: string;
}

export interface CashRegister {
  _id: string;
  name: string;
  branchId: Branch | string;
  cashierId: User | string | null; // Campo temporal asignado al abrir la caja
  managerId: User | string;
  currentBalance: number;
  initialBalance: number;
  isOpen: boolean;
  lastRegistry: LastRegistry[];
  expenses: Expense[];
  lastOpen: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashRegisterData {
  name: string;
  branchId: string;
  cashierId?: string | null; // Opcional, se asigna temporalmente al abrir la caja
  managerId: string;
  initialBalance?: number;
}

export interface UpdateCashRegisterData {
  name?: string;
  branchId?: string;
  cashierId?: string;
  managerId?: string;
}

export interface OrderSummary {
  _id: string;
  orderNumber: string;
  clientName: string;
  recipientName: string;
  total: number;
  advance: number;
  shippingType: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  itemsCount: number;
}

export interface CashRegisterSummary {
  cashRegister: {
    _id: string;
    name: string;
    branchId: Branch;
    cashierId: User | null;
    managerId: User;
    isOpen: boolean;
    lastOpen: string | null;
  };
  totals: {
    initialBalance: number;
    totalSales: number;
    totalExpenses: number;
    currentBalance: number;
  };
  salesByPaymentType: {
    efectivo: number;
    credito: number;
    transferencia: number;
    intercambio: number;
  };
  orders: OrderSummary[];
  expenses: Expense[];
}
