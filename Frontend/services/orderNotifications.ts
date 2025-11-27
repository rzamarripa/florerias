import { apiCall } from "@/utils/api";

export interface OrderNotification {
  _id: string;
  userId: string;
  username: string;
  userRole: string;
  branchId: {
    _id: string;
    branchName: string;
    branchCode?: string;
  };
  orderNumber: string;
  orderId: {
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
  } | null;
  isRead: boolean;
  isCanceled: boolean;
  isDiscountAuth: boolean;
  discountAuthId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderNotificationsResponse {
  success: boolean;
  data: OrderNotification[];
  unreadCount: number;
}

export interface MarkAsReadResponse {
  success: boolean;
  data?: OrderNotification;
  message: string;
}

export const orderNotificationsService = {
  // Obtener todas las notificaciones
  getNotifications: async () => {
    const response = await apiCall<OrderNotificationsResponse>('/order-notifications');
    return response;
  },

  // Marcar notificación como leída
  markAsRead: async (notificationId: string) => {
    const response = await apiCall<MarkAsReadResponse>(`/order-notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    return response;
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async () => {
    const response = await apiCall<MarkAsReadResponse>('/order-notifications/read-all', {
      method: 'PATCH',
    });
    return response;
  },

  // Eliminar notificación
  deleteNotification: async (notificationId: string) => {
    const response = await apiCall<MarkAsReadResponse>(`/order-notifications/${notificationId}`, {
      method: 'DELETE',
    });
    return response;
  },
};
