// Order Status Types
export type OrderStatus = 'pendiente' | 'en-proceso' | 'completado' | 'cancelado';

// Client Info
export interface ClientInfo {
  clientId?: string;
  name: string;
  phone?: string;
  email?: string;
}

// Delivery Data
export interface DeliveryData {
  recipientName: string;
  deliveryDateTime: string;
  message?: string;
  street?: string;
  neighborhood?: string;
  reference?: string;
}

// Order Item
export interface OrderItem {
  _id: string;
  isProduct: boolean;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Payment Method
export interface PaymentMethod {
  _id: string;
  name: string;
  type: string;
  status: boolean;
}

// Order
export interface Order {
  _id: string;
  clientInfo: ClientInfo;
  salesChannel: 'tienda' | 'whatsapp' | 'facebook';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda';
  anonymous: boolean;
  quickSale: boolean;
  deliveryData: DeliveryData;
  paymentMethod: PaymentMethod | string;
  discount: number;
  discountType: 'porcentaje' | 'cantidad';
  subtotal: number;
  total: number;
  advance: number;
  paidWith: number;
  change: number;
  remainingBalance: number;
  sendToProduction: boolean;
  status: OrderStatus;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
}

// Kanban Column Data
export interface KanbanColumn {
  id: OrderStatus;
  title: string;
  orders: Order[];
  color: string;
}

// Filters
export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  searchTerm?: string;
  product?: string;
}

// API Response
export interface OrdersResponse {
  data: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
