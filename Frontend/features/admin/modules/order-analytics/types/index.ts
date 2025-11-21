// Order Analytics Types

export interface OrderAnalyticsSummary {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  totalProducts: number;
  percentageChange: number;
}

export interface SalesByCategory {
  category: string;
  total: number;
  percentage: number;
}

export interface SalesByPaymentMethod {
  method: string;
  amount: number;
  count: number;
}

export interface SalesByHour {
  hour: string;
  count: number;
  amount: number;
}

export interface SalesByDayOfWeek {
  day: string;
  count: number;
  amount: number;
}

export interface TopProduct {
  _id: string;
  name: string;
  quantity: number;
  revenue: number;
  image?: string;
}

export interface CashierRanking {
  _id: string;
  name: string;
  email: string;
  salesCount: number;
  totalRevenue: number;
  averageTicket: number;
}

export interface SalesTrend {
  date: string;
  count: number;
  amount: number;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
}

export interface MonthlyComparison {
  currentMonth: {
    sales: number;
    revenue: number;
  };
  previousMonth: {
    sales: number;
    revenue: number;
  };
  percentageChange: {
    sales: number;
    revenue: number;
  };
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  cashierId?: string;
  categoryId?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export interface AnalyticsDashboardData {
  summary: OrderAnalyticsSummary;
  salesTrend: SalesTrend[];
  monthlyComparison: MonthlyComparison;
  salesByCategory: SalesByCategory[];
  salesByPaymentMethod: SalesByPaymentMethod[];
  salesByHour: SalesByHour[];
  salesByDayOfWeek: SalesByDayOfWeek[];
  topProducts: TopProduct[];
  cashierRanking: CashierRanking[];
  lowStockProducts: LowStockProduct[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsDashboardData;
  message?: string;
}

export interface ExportFilters extends AnalyticsFilters {
  format: 'pdf' | 'excel';
  includeCharts?: boolean;
}
