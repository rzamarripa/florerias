export interface ReportFilters {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  branchId?: string;
}

export interface SalesByProductRow {
  productId?: string | null;
  productName: string;
  quantity: number;
  amount: number;
  ordersCount: number;
}

export interface SalesByCategoryRow {
  categoryId?: string | null;
  categoryName: string;
  quantity: number;
  amount: number;
  ordersCount: number;
}

export interface ReportTotals {
  quantity: number;
  amount: number;
}

export interface SalesByProductResponse {
  success: boolean;
  data: {
    rows: SalesByProductRow[];
    totals: ReportTotals;
  };
}

export interface SalesByCategoryResponse {
  success: boolean;
  data: {
    rows: SalesByCategoryRow[];
    totals: ReportTotals;
  };
}
