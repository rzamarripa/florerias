export interface Insumo {
  nombre: string;
  cantidad: number;
  importeVenta: number;
  isExtra: boolean;
}

export interface OrderItem {
  _id: string;
  isProduct: boolean;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productCategory: string;
  insumos: Insumo[];
}

export interface Order {
  _id: string;
  orderNumber: string;
  branchId: string;
  items: OrderItem[];
  total: number;
  status: string;
  orderDate: string;
  materials: Insumo[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialUsageMetrics {
  totalMaterialsUsed: number;
  totalMaterialsCost: number;
  mostUsedMaterials: Array<{
    name: string;
    quantity: number;
    totalCost: number;
  }>;
  materialsPerOrder: number;
}

export interface QuarterlyData {
  quarter: string; // Ahora será "Semana 1", "Semana 2", etc.
  period: string;  // Ahora será el rango de fechas de la semana
  revenue: number; // Suma de importeVenta de insumos extras
  expense: number; // Suma de price (costo) de materiales extras
  margin: number;  // Diferencia entre revenue y expense
}

export interface DashboardMetrics {
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number; // Suma importeVenta de insumos isExtra=true
  totalExpenses: number; // Suma importeVenta de insumos isExtra=false
  netProfit: number; // Suma price de materiales isExtra=true
  cashFlow: number; // Suma price de materiales isExtra=false
  totalProfit: number; // Para compatibilidad con gráficos (usa totalRevenue)
  totalOrdersChange: string;
  totalProductsChange: string;
  totalProfitStatus: string;
  cashFlowChange: string;
  quarterlyReports: QuarterlyData[];
  ordersOverTime: Array<{
    period: string;
    count: number;
  }>;
  profitOverTime: Array<{
    date: string;
    profit: number;
  }>;
}

export interface Material {
  _id: string;
  name: string;
  price: number;
  cost: number;
  status: boolean;
}

export interface GetOrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface InsumoDetail {
  orderId: string;
  orderNumber: string;
  insumoName: string;
  stockUsed: number;
  stockRemaining: number;
  isExtra: boolean;
  totalVenta: number;
}
