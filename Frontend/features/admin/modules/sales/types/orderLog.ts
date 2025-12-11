export type OrderEventType =
  | 'order_created'
  | 'payment_received'
  | 'payment_deleted'
  | 'order_cancelled'
  | 'stage_changed'
  | 'status_changed'
  | 'sent_to_shipping'
  | 'order_completed'
  | 'discount_requested'
  | 'discount_approved'
  | 'discount_rejected'
  | 'discount_redeemed';

export interface OrderLog {
  _id: string;
  orderId: string;
  eventType: OrderEventType;
  description: string;
  userId: string;
  userName: string;
  userRole: string;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderLogFilters {
  page?: number;
  limit?: number;
  eventType?: OrderEventType;
  startDate?: string;
  endDate?: string;
}
