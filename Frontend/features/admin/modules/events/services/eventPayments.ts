import { apiCall } from "@/utils/api";
import {
  EventPayment,
  CreateEventPaymentData,
  GetEventPaymentsResponse,
} from "../types";

export const eventPaymentsService = {
  // Crear un nuevo pago para un evento
  createEventPayment: async (
    paymentData: CreateEventPaymentData
  ): Promise<{
    success: boolean;
    data: EventPayment;
    message: string;
    event: {
      totalPaid: number;
      balance: number;
      paymentStatus: string;
    };
  }> => {
    const response = await apiCall<{
      success: boolean;
      data: EventPayment;
      message: string;
      event: {
        totalPaid: number;
        balance: number;
        paymentStatus: string;
      };
    }>("/event-payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
    return response;
  },

  // Obtener todos los pagos de un evento
  getEventPayments: async (
    eventId: string
  ): Promise<GetEventPaymentsResponse> => {
    const response = await apiCall<GetEventPaymentsResponse>(
      `/event-payments/event/${eventId}`
    );
    return response;
  },

  // Obtener un pago específico por ID
  getEventPaymentById: async (
    paymentId: string
  ): Promise<{ success: boolean; data: EventPayment }> => {
    const response = await apiCall<{ success: boolean; data: EventPayment }>(
      `/event-payments/${paymentId}`
    );
    return response;
  },

  // Eliminar un pago
  deleteEventPayment: async (
    paymentId: string
  ): Promise<{
    success: boolean;
    message: string;
    event: {
      totalPaid: number;
      balance: number;
      paymentStatus: string;
    };
  }> => {
    const response = await apiCall<{
      success: boolean;
      message: string;
      event: {
        totalPaid: number;
        balance: number;
        paymentStatus: string;
      };
    }>(`/event-payments/${paymentId}`, {
      method: "DELETE",
    });
    return response;
  },
};
