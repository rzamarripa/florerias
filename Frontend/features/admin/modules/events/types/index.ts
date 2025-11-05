export interface PaymentMethod {
  _id: string;
  name: string;
  abbreviation: string;
  status: boolean;
}

export interface Event {
  _id: string;
  folio: number;
  client: {
    _id: string;
    name: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    clientNumber: string;
  };
  eventDate: string;
  paymentStatus: "pending" | "partial" | "paid";
  orderDate: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  paymentMethod?: PaymentMethod;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  branch: {
    _id: string;
    branchName: string;
    branchCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  client: string;
  eventDate: string;
  orderDate?: string;
  totalAmount: number;
  totalPaid?: number;
  paymentMethod?: string;
}

export interface UpdateEventData {
  client?: string;
  eventDate?: string;
  orderDate?: string;
  totalAmount?: number;
  totalPaid?: number;
  paymentMethod?: string;
}

export interface GetEventsResponse {
  success: boolean;
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EventFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  paymentStatus?: string;
  clientId?: string;
}

export interface EventPayment {
  _id: string;
  event: string | Event;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  branch: {
    _id: string;
    branchName: string;
    branchCode: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPaymentData {
  eventId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}

export interface GetEventPaymentsResponse {
  success: boolean;
  data: EventPayment[];
}
