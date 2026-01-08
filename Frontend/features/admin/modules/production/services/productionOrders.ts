import api from '@/services/api';

interface ProductionFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
  page?: number;
  limit?: number;
}

interface OrderResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const productionOrdersService = {
  // Obtener órdenes del día actual
  getTodayOrders: async (filters: ProductionFilters): Promise<OrderResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      // Solo órdenes con anticipo o enviadas a producción
      params.append('status', 'pendiente');
      
      const response = await api.get(`/orders?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching today orders:', error);
      throw error;
    }
  },

  // Obtener órdenes del día siguiente
  getTomorrowOrders: async (filters: ProductionFilters): Promise<OrderResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      // Solo órdenes con anticipo o enviadas a producción
      params.append('status', 'pendiente');
      
      const response = await api.get(`/orders?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tomorrow orders:', error);
      throw error;
    }
  },

  // Obtener órdenes posteriores
  getLaterOrders: async (filters: ProductionFilters): Promise<OrderResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      // Solo órdenes con anticipo o enviadas a producción
      params.append('status', 'pendiente');
      
      const response = await api.get(`/orders?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching later orders:', error);
      throw error;
    }
  },
};