export interface BranchStats {
  _id: string;
  branchName: string;
  branchCode: string;
  manager: {
    _id: string;
    username: string;
    email: string;
    profile: {
      name: string;
      lastName: string;
      fullName: string;
      image?: string;
    };
  };
  employees: Array<{
    _id: string;
    username: string;
    email: string;
    profile: {
      name: string;
      lastName: string;
      fullName: string;
      image?: string;
    };
    role: {
      name: string;
    };
  }>;
  stats: {
    totalExpenses: number;
    totalPurchases: number;
    totalSales: number;
    activeCashRegisters: number;
    completedOrders: number;
    totalOrders: number;
    completionPercentage: number;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  isActive: boolean;
}

export interface DateFilters {
  startDate: string;
  endDate: string;
  viewMode: "dia" | "semana" | "mes";
}

export interface Employee {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profile: {
    name: string;
    lastName: string;
    fullName: string;
    estatus: boolean;
    image?: string;
  };
  role: {
    _id: string;
    name: string;
  };
}

export interface Sale {
  _id: string;
  orderNumber: string;
  clientInfo: {
    name: string;
    phone?: string;
    email?: string;
  };
  total: number;
  status: string;
  salesChannel: string;
  createdAt: string;
  paymentMethod: {
    name: string;
  };
}

export interface Expense {
  _id: string;
  folio: number;
  paymentDate: string;
  user: {
    username: string;
    profile: {
      fullName: string;
    };
  };
  concept: {
    name: string;
    description: string;
  };
  total: number;
  expenseType: string;
}

export interface Purchase {
  _id: string;
  folio: number;
  paymentDate: string;
  user: {
    username: string;
    profile: {
      fullName: string;
    };
  };
  concept: {
    name: string;
    description: string;
  };
  amount: number;
  paymentMethod: {
    name: string;
  };
  provider?: {
    tradeName: string;
    legalName: string;
  };
}
