import { apiCall } from '@/utils/api';

export interface DeliveryDriver {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  profile: {
    name?: string;
    lastName?: string;
    fullName?: string;
    estatus: boolean;
  };
  role: {
    _id: string;
    name: string;
    description?: string;
  };
  branch?: {
    _id: string;
    branchName: string;
    branchCode?: string;
    companyId: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetDeliveryDriversParams {
  page?: number;
  limit?: number;
  search?: string;
  estatus?: boolean;
  branchId?: string;
}

export interface GetDeliveryDriversResponse {
  success: boolean;
  data: DeliveryDriver[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export const deliveryDriversService = {
  /**
   * Obtener todos los repartidores con filtros opcionales
   */
  getAllDeliveryDrivers: async (params?: GetDeliveryDriversParams): Promise<GetDeliveryDriversResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.estatus !== undefined) queryParams.append('estatus', params.estatus.toString());
    if (params?.branchId) queryParams.append('branchId', params.branchId);

    const response = await apiCall<GetDeliveryDriversResponse>(`/delivery-drivers?${queryParams.toString()}`);
    return response;
  },

  /**
   * Obtener repartidores activos de una sucursal específica
   */
  getActiveDeliveryDriversByBranch: async (branchId: string): Promise<DeliveryDriver[]> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('branchId', branchId);
      queryParams.append('estatus', 'true');
      queryParams.append('limit', '100');
      
      const response = await apiCall<GetDeliveryDriversResponse>(`/delivery-drivers?${queryParams.toString()}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error al obtener repartidores de la sucursal:', error);
      return [];
    }
  },

  /**
   * Obtener un repartidor por ID
   */
  getDeliveryDriverById: async (id: string): Promise<DeliveryDriver> => {
    const response = await apiCall<{ success: boolean; data: DeliveryDriver }>(`/delivery-drivers/${id}`);
    return response.data;
  },

  /**
   * Actualizar un repartidor
   */
  updateDeliveryDriver: async (id: string, data: Partial<DeliveryDriver>): Promise<DeliveryDriver> => {
    const response = await apiCall<{ success: boolean; data: DeliveryDriver; message: string }>(
      `/delivery-drivers/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  /**
   * Eliminar un repartidor
   */
  deleteDeliveryDriver: async (id: string): Promise<void> => {
    await apiCall<{ success: boolean; message: string }>(
      `/delivery-drivers/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Activar un repartidor
   */
  activateDeliveryDriver: async (id: string): Promise<DeliveryDriver> => {
    const response = await apiCall<{ success: boolean; data: DeliveryDriver; message: string }>(
      `/delivery-drivers/${id}/activate`,
      {
        method: 'PUT',
      }
    );
    return response.data;
  },

  /**
   * Desactivar un repartidor
   */
  deactivateDeliveryDriver: async (id: string): Promise<DeliveryDriver> => {
    const response = await apiCall<{ success: boolean; data: DeliveryDriver; message: string }>(
      `/delivery-drivers/${id}/deactivate`,
      {
        method: 'PUT',
      }
    );
    return response.data;
  }
};