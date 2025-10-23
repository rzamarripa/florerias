export interface ClientInfo {
  clientId?: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface DeliveryData {
  recipientName: string;
  deliveryDateTime: string;
  message?: string;
  street?: string;
  neighborhood?: string;
  reference?: string;
}

export interface OrderItem {
  _id?: string;
  isProduct: boolean;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Order {
  _id: string;
  branchId: string | {
    _id: string;
    branchName: string;
    branchCode?: string;
  };
  cashRegisterId?: string | {
    _id: string;
    name: string;
    isOpen: boolean;
    currentBalance?: number;
  } | null;
  clientInfo: ClientInfo;
  salesChannel: 'tienda' | 'whatsapp' | 'facebook';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda';
  anonymous: boolean;
  quickSale: boolean;
  deliveryData: DeliveryData;
  paymentMethod: string; // ID del método de pago
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
  orderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  branchId: string;
  cashRegisterId?: string | null;
  storageId?: string;
  clientInfo: ClientInfo;
  salesChannel: 'tienda' | 'whatsapp' | 'facebook';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda';
  anonymous?: boolean;
  quickSale?: boolean;
  deliveryData: DeliveryData;
  paymentMethod: string; // ID del método de pago
  discount?: number;
  discountType?: 'porcentaje' | 'cantidad';
  subtotal: number;
  total: number;
  advance?: number;
  paidWith?: number;
  change?: number;
  remainingBalance?: number;
  sendToProduction?: boolean;
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  status?: 'pendiente' | 'en-proceso' | 'completado' | 'cancelado';
}

export interface CreateOrderResponseData {
  success: boolean;
  data: Order;
  message: string;
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
  status?: string;
  salesChannel?: string;
  clientName?: string;
  orderNumber?: string;
}

export type SalesChannelType = 'tienda' | 'whatsapp' | 'facebook';
export type ShippingType = 'envio' | 'tienda';
