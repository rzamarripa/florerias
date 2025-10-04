export interface ClientInfo {
  clientId?: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface OrderItem {
  _id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Order {
  _id: string;
  clientInfo: ClientInfo;
  salesChannel: 'tienda' | 'whatsapp' | 'facebook';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda' | 'anonimo' | 'venta-rapida';
  recipientName?: string;
  deliveryDateTime?: string;
  message?: string;
  paymentMethod: 'efectivo' | 'deposito' | 'transferencia' | 'oxxo' | 'tarjeta-debito' | 'tarjeta-credito' | 'amex' | 'cheque' | 'inter' | 'credito';
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
  clientInfo: ClientInfo;
  salesChannel: 'tienda' | 'whatsapp' | 'facebook';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda' | 'anonimo' | 'venta-rapida';
  recipientName?: string;
  deliveryDateTime?: string;
  message?: string;
  paymentMethod: 'efectivo' | 'deposito' | 'transferencia' | 'oxxo' | 'tarjeta-debito' | 'tarjeta-credito' | 'amex' | 'cheque' | 'inter' | 'credito';
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
export type ShippingType = 'envio' | 'tienda' | 'anonimo' | 'venta-rapida';
export type PaymentMethodType = 'efectivo' | 'deposito' | 'transferencia' | 'oxxo' | 'tarjeta-debito' | 'tarjeta-credito' | 'amex' | 'cheque' | 'inter' | 'credito';
