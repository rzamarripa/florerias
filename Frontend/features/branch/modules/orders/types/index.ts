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
  neighborhoodId?: string;
  deliveryPrice?: number;
  reference?: string;
}

export interface OrderItemInsumo {
  nombre: string;
  cantidad: number;
  importeVenta: number;
  isExtra?: boolean;
}

export interface OrderItem {
  _id?: string;
  isProduct: boolean;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productCategory: string | null;
  insumos?: OrderItemInsumo[];
}

export interface OrderMaterial {
  nombre: string;
  cantidad: number;
  importeVenta: number;
  isExtra: boolean;
}

export interface OrderPayment {
  _id?: string;
  orderId: string;
  amount: number;
  paymentMethod: string | {
    _id: string;
    name: string;
    abbreviation?: string;
  };
  cashRegisterId: string | {
    _id: string;
    name: string;
  };
  date: string;
  registeredBy?: string | {
    _id: string;
    name: string;
    email?: string;
  } | null;
  notes?: string;
  orderDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Mantener Payment como alias para compatibilidad temporal
export type Payment = OrderPayment;

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
  salesChannel: 'tienda' | 'whatsapp' | 'facebook' | 'instagram';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda' | 'redes_sociales';
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
  payments: (string | OrderPayment)[];
  sendToProduction: boolean;
  status: 'pendiente' | 'en-proceso' | 'completado' | 'cancelado' | 'sinAnticipo';
  orderNumber?: string;
  orderDate?: string;
  isSocialMediaOrder?: boolean;
  socialMedia?: 'whatsapp' | 'facebook' | 'instagram' | null;
  comprobanteUrl?: string | null;
  comprobantePath?: string | null;
  arregloUrl?: string | null;
  arregloPath?: string | null;
  materials?: OrderMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  branchId: string;
  cashRegisterId?: string | null;
  storageId?: string | null;
  clientInfo: ClientInfo;
  salesChannel: 'tienda' | 'whatsapp' | 'facebook' | 'instagram';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda' | 'redes_sociales';
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
  orderDate?: string; // Fecha de la orden
  isSocialMediaOrder?: boolean;
  socialMedia?: 'whatsapp' | 'facebook' | 'instagram' | null;
  comprobanteUrl?: string | null;
  comprobantePath?: string | null;
  arregloUrl?: string | null;
  arregloPath?: string | null;
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  status?: 'pendiente' | 'en-proceso' | 'completado' | 'cancelado' | 'sinAnticipo';
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

export type SalesChannelType = 'tienda' | 'whatsapp' | 'facebook' | 'instagram';
export type ShippingType = 'envio' | 'tienda' | 'redes_sociales';

// Tipos para la gestión de pagos
export interface CreateOrderPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  cashRegisterId: string;
  registeredBy: string;
  notes?: string;
}

export interface OrderPaymentResponse {
  message: string;
  payment: OrderPayment;
  order: {
    advance: number;
    remainingBalance: number;
  };
}
