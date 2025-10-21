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

export interface CashRegister {
  _id: string;
  name: string;
  branchId: Branch | string;
  cashierId: User | string;
  managerId: User | string;
  currentBalance: number;
  initialBalance: number;
  isOpen: boolean;
  lastRegistry: LastRegistry[];
  lastOpen: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashRegisterData {
  name: string;
  branchId: string;
  cashierId: string;
  managerId: string;
  initialBalance?: number;
}

export interface UpdateCashRegisterData {
  name?: string;
  branchId?: string;
  cashierId?: string;
  managerId?: string;
}
