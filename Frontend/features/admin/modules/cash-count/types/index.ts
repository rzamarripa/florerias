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

export interface CashRegisterRef {
  _id: string;
  name: string;
  branchId?: Branch;
}

export interface OrderLog {
  _id?: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  recipientName: string;
  total: number;
  advance: number;
  discount: number;
  discountType: string | null;
  shippingType: string;
  paymentMethod: string;
  status: string;
  saleDate: string;
  itemsCount: number;
  sendToProduction: boolean;
}

export interface ExpenseLog {
  _id?: string;
  expenseConcept: string;
  amount: number;
  expenseDate: string;
}

export interface BuyLog {
  _id?: string;
  buyId: string;
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

export interface DiscountAuthLog {
  _id?: string;
  authId: string;
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
    orders: OrderLog[];
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

export interface CashRegisterLog {
  _id: string;
  cashRegisterId: CashRegisterRef;
  cashRegisterName: string;
  branchId: Branch;
  cashierId: User | null;
  managerId: User;
  openedAt: string | null;
  closedAt: string;
  totals: {
    initialBalance: number;
    totalSales: number;
    totalExpenses: number;
    finalBalance: number;
    remainingBalance: number;
  };
  salesByPaymentType: {
    efectivo: number;
    credito: number;
    transferencia: number;
    intercambio: number;
  };
  orders: OrderLog[];
  expenses: ExpenseLog[];
  buys: BuyLog[];
  discountAuths: DiscountAuthLog[];
  ordersByPaymentMethod?: OrdersByPaymentMethod;
  paymentsByMethod?: PaymentsByMethod;
  canceledOrders?: OrderLog[];
  authorizedDiscounts?: DiscountAuthLog[];
  createdAt: string;
  updatedAt: string;
}
