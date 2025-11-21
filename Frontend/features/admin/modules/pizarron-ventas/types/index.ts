// Order Status Types
export type OrderStatus = 'pendiente' | 'en-proceso' | 'completado' | 'cancelado' | 'sinAnticipo';

// Import and re-export StageCatalog from stageCatalogs module to avoid duplication
import type { StageCatalog, RGBColor as StageColor } from '@/features/admin/modules/stageCatalogs/types';
export type { StageCatalog, StageColor };

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
  salesChannel: 'tienda' | 'whatsapp' | 'facebook' | 'instagram';
  items: OrderItem[];
  shippingType: 'envio' | 'tienda' | 'redes_sociales';
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
  sentToShipping?: boolean;
  status: OrderStatus;
  stage?: string | StageCatalog | null; // Referencia a StageCatalog
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
}

// Kanban Column Data (basada en Stages)
export interface KanbanColumn {
  id: string; // ID del stage
  stageNumber: number;
  title: string;
  abreviation: string;
  orders: Order[];
  color: StageColor;
  boardType: 'Produccion' | 'Envio';
}

// Filters
export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  searchTerm?: string;
  product?: string;
  branchId?: string;
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
