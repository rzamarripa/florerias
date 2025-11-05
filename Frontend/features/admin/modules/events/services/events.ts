import { apiCall } from "@/utils/api";
import {
  Event,
  EventFilters,
  CreateEventData,
  GetEventsResponse,
  UpdateEventData,
} from "../types";

export const eventsService = {
  getAllEvents: async (filters: EventFilters = {}): Promise<GetEventsResponse> => {
    const { page = 1, limit = 15, startDate, endDate, branchId, paymentStatus, clientId } = filters;

    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    if (branchId) searchParams.append('branchId', branchId);
    if (paymentStatus) searchParams.append('paymentStatus', paymentStatus);
    if (clientId) searchParams.append('clientId', clientId);

    const response = await apiCall<GetEventsResponse>(`/events?${searchParams}`);
    return response;
  },

  getEventById: async (eventId: string): Promise<{ success: boolean; data: Event }> => {
    const response = await apiCall<{ success: boolean; data: Event }>(`/events/${eventId}`);
    return response;
  },

  createEvent: async (eventData: CreateEventData): Promise<{ success: boolean; data: Event; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Event; message: string }>("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
    return response;
  },

  updateEvent: async (
    eventId: string,
    eventData: UpdateEventData
  ): Promise<{ success: boolean; data: Event; message: string }> => {
    const response = await apiCall<{ success: boolean; data: Event; message: string }>(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
    return response;
  },

  deleteEvent: async (eventId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/events/${eventId}`, {
      method: "DELETE",
    });
    return response;
  },
};
