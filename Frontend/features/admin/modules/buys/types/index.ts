export interface Buy {
  _id: string;
  paymentDate: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  folio: number;
  concept: string;
  amount: number;
  paymentMethod: {
    _id: string;
    name: string;
    abbreviation: string;
  };
  description: string;
  branch: {
    _id: string;
    branchName: string;
    branchCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuyData {
  paymentDate: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  description?: string;
}

export interface UpdateBuyData {
  paymentDate?: string;
  concept?: string;
  amount?: number;
  paymentMethod?: string;
  description?: string;
}

export interface GetBuysResponse {
  success: boolean;
  data: Buy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BuyFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  paymentMethodId?: string;
}
