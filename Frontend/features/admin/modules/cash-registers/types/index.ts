export interface Manager {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
  };
}

export interface Branch {
  _id: string;
  branchName: string;
  branchCode?: string;
  manager?: Manager | string;
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

export interface ExpenseSummary {
  _id: string;
  folio: number;
  concept: string;
  conceptDescription: string;
  total: number;
  paymentDate: string;
  user: string;
  expenseType: string;
}

export interface BuySummary {
  _id: string;
  folio: number;
  concept: string;
  conceptDescription: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  provider: string;
  user: string;
  description: string;
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
  isSocialMediaBox: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashRegisterData {
  name: string;
  branchId: string;
  cashierId?: string | null; // Opcional, se asigna temporalmente al abrir la caja
  managerId: string;
  initialBalance?: number;
  isSocialMediaBox?: boolean;
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
  discount?: number;
  sendToProduction?: boolean;
}

export interface DiscountAuthSummary {
  _id: string;
  orderId: string;
  orderNumber: string;
  message: string;
  requestedBy: string;
  managerId: string;
  discountValue: number;
  discountType: 'porcentaje' | 'cantidad';
  discountAmount: number;
  isAuth: boolean | null;
  authFolio: string | null;
  isRedeemed: boolean;
  createdAt: string;
  approvedAt: string | null;
}

export interface OrdersByPaymentMethod {
  [paymentMethodName: string]: {
    orders: OrderSummary[];
    total: number;
    count: number;
  };
}

export interface PaymentSummary {
  _id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  date: string;
  notes: string;
  isAdvance: boolean;
  clientName: string;
  recipientName: string;
  orderStatus: string;
  registeredBy: string;
}

export interface PaymentsByMethod {
  [paymentMethodName: string]: {
    payments: PaymentSummary[];
    total: number;
    count: number;
  };
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
  ordersByPaymentMethod?: OrdersByPaymentMethod; // Nueva estructura agrupada por método de pago
  paymentsByMethod?: PaymentsByMethod; // Nueva estructura con pagos individuales agrupados por método
  expenses: ExpenseSummary[];
  buys: BuySummary[];
  discountAuths: DiscountAuthSummary[];
}
