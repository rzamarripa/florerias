// Order/Sale Types
export interface Sale {
  _id: string;
  orderNumber: string;
  branchId: string | { _id: string; branchName: string; branchCode: string };
  clientInfo: {
    clientId?: string | null;
    name: string;
    phone?: string;
    email?: string;
  };
  salesChannel: 'tienda' | 'whatsapp' | 'facebook';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda';
  anonymous: boolean;
  quickSale: boolean;
  deliveryData: {
    recipientName: string;
    deliveryDateTime: string;
    message?: string;
    street?: string | null;
    neighborhood?: string | null;
    reference?: string | null;
  };
  paymentMethod: string | PaymentMethodPopulated;
  discount: number;
  discountType: 'porcentaje' | 'cantidad';
  subtotal: number;
  total: number;
  advance: number;
  paidWith: number;
  change: number;
  remainingBalance: number;
  sendToProduction: boolean;
  status: 'pendiente' | 'en-proceso' | 'completado' | 'cancelado';
  stage?: {
    _id: string;
    name: string;
    abreviation: string;
    stageNumber: number;
    boardType: 'Produccion' | 'Envio';
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    isActive: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  isProduct: boolean;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentMethodPopulated {
  _id: string;
  name: string;
  abbreviation: string;
}

// Filter Types
export interface SaleFilters {
  page?: number;
  limit?: number;
  status?: string;
  salesChannel?: string;
  clientName?: string;
  orderNumber?: string;
  paymentMethodId?: string;
  startDate?: string;
  endDate?: string;
  viewMode?: 'dia' | 'semana' | 'mes';
  branchId?: string;
}

// Response Types
export interface GetSalesResponse {
  success: boolean;
  data: Sale[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetSaleResponse {
  success: boolean;
  data: Sale;
}
