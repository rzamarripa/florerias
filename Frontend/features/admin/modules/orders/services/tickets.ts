import { apiCall } from "@/utils/api";

interface CreateTicketData {
  orderId: string;
  branchId: string;
  url: string;
  path: string;
  isStoreTicket: boolean;
}

interface Ticket {
  _id: string;
  orderId: string;
  branchId: string;
  url: string;
  path: string;
  isStoreTicket: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

/**
 * Crea o actualiza un ticket
 */
export const createTicket = async (ticketData: CreateTicketData): Promise<Ticket> => {
  try {
    const response = await apiCall<ApiResponse<Ticket>>('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
    return response.data;
  } catch (error) {
    console.error('Error creando ticket:', error);
    throw error;
  }
};

/**
 * Obtiene todos los tickets de una orden
 */
export const getTicketsByOrderId = async (orderId: string): Promise<Ticket[]> => {
  try {
    const response = await apiCall<ApiResponse<Ticket[]>>(`/tickets/order/${orderId}`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo tickets:', error);
    throw error;
  }
};

/**
 * Obtiene el ticket de venta de una orden
 */
export const getStoreTicket = async (orderId: string): Promise<Ticket | null> => {
  try {
    const response = await apiCall<ApiResponse<Ticket>>(`/tickets/order/${orderId}/store`, {
      method: 'GET',
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error obteniendo ticket de venta:', error);
    throw error;
  }
};

/**
 * Obtiene el ticket de envío de una orden
 */
export const getDeliveryTicket = async (orderId: string): Promise<Ticket | null> => {
  try {
    const response = await apiCall<ApiResponse<Ticket>>(`/tickets/order/${orderId}/delivery`, {
      method: 'GET',
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error obteniendo ticket de envío:', error);
    throw error;
  }
};

/**
 * Elimina un ticket
 */
export const deleteTicket = async (ticketId: string): Promise<void> => {
  try {
    await apiCall(`/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error eliminando ticket:', error);
    throw error;
  }
};