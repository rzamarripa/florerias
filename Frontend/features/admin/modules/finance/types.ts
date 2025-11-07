export interface Payment {
  _id: string;
  folio: string;
  paymentDate: string;
  paymentMethod: string;
  client: string;
  user: string;
  total: number;
}

export interface OrderPayment {
  _id: string;
  orderId: {
    _id: string;
    orderNumber: string;
    clientInfo: {
      clientId?: string;
      name: string;
      phone?: string;
      email?: string;
    };
    branchId?: {
      _id: string;
      name: string;
    };
  };
  amount: number;
  paymentMethod: {
    _id: string;
    name: string;
  };
  cashRegisterId?: {
    _id: string;
    name: string;
  };
  date: string;
  registeredBy: {
    _id: string;
    name: string;
    lastName: string;
  };
  notes?: string;
}

export interface DiscountedSale {
  _id: string;
  orderNumber: string;
  clientName: string;
  branchName: string;
  createdAt: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  discountType: string;
  total: number;
  status: string;
}

export interface Buy {
  _id: string;
  folio: number;
  concept: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  branchName: string;
  userName: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  folio: number;
  concept: string;
  total: number;
  expenseType: string;
  paymentDate: string;
  branchName: string;
  userName: string;
  createdAt: string;
}

export interface FinanceFilters {
  startDate: string;
  endDate: string;
  clientIds?: string[];
  paymentMethods?: string[];
  branchId?: string;
  branchIds?: string[];
  cashierId?: string;
}

export interface FinanceStats {
  totalFloreria: number;
  totalEventos: number;
  totalGastos: number;
  totalCompras: number;
  utilidad: number;
}

export interface IncomeStats {
  transferencia: number;
  efectivo: number;
  tarjeta: number;
  deposito: number;
}

// Importar PaymentMethod de payment-methods module
export type { PaymentMethod } from "../payment-methods/types";
