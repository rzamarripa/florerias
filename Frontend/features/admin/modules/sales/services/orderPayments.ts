import { apiCall } from "@/utils/api";

export interface OrderPayment {
  _id: string;
  orderId: string;
  amount: number;
  paymentMethod: {
    _id: string;
    name: string;
  };
  cashRegisterId: {
    _id: string;
    name: string;
  };
  date: string;
  registeredBy: {
    _id: string;
    username: string;
    email: string;
  };
  notes: string;
  isAdvance?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  cashRegisterId: string;
  registeredBy: string;
  notes?: string;
}

export interface CreateOrderPaymentResponse {
  message: string;
  payment: OrderPayment;
  order: {
    advance: number;
    remainingBalance: number;
  };
}

export const orderPaymentsService = {
  // Obtener todos los pagos de una orden
  getOrderPayments: async (orderId: string): Promise<OrderPayment[]> => {
    const response = await apiCall<OrderPayment[]>(`/order-payments/order/${orderId}`);
    return response as any;
  },

  // Crear un nuevo pago
  createOrderPayment: async (paymentData: CreateOrderPaymentData): Promise<CreateOrderPaymentResponse> => {
    const response = await apiCall<CreateOrderPaymentResponse>("/order-payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
    return response as any;
  },

  // Eliminar un pago
  deleteOrderPayment: async (paymentId: string): Promise<{ message: string; order: { advance: number; remainingBalance: number } }> => {
    const response = await apiCall<{ message: string; order: { advance: number; remainingBalance: number } }>(`/order-payments/${paymentId}`, {
      method: "DELETE",
    });
    return response;
  },
};
