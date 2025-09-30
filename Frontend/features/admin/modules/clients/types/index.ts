export interface ClientComment {
  _id?: string;
  comentario: string;
  tipo: 'positive' | 'negative';
  usuario: string;
  fechaCreacion: string;
}

export interface Client {
  _id: string;
  name: string;
  lastName: string;
  fullName: string;
  clientNumber: string;
  phoneNumber: string;
  points: number;
  status: boolean;
  purchases: string[];
  comentarios: ClientComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  lastName: string;
  phoneNumber: string;
  points?: number;
  status?: boolean;
}

export interface UpdateClientData {
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  points?: number;
  status?: boolean;
}

export interface CreateClientResponseData {
  client: Client;
}

export interface GetClientsResponse {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Client[];
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  name?: string;
  lastName?: string;
  clientNumber?: string;
  phoneNumber?: string;
  status?: boolean;
}

export type FilterType = 'name' | 'lastName' | 'clientNumber' | 'phoneNumber';

export interface FilterOption {
  value: FilterType;
  label: string;
}

export interface AddCommentData {
  comentario: string;
  tipo: 'positive' | 'negative';
  usuario: string;
}

export interface AddCommentResponse {
  success: boolean;
  message: string;
  data: {
    client: Client;
  };
}