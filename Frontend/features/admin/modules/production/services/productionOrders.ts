import { apiCall } from '@/utils/api';

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
  // Obtener órdenes del día actual (basado en fecha de entrega)
  getTodayOrders: async (filters: ProductionFilters): Promise<OrderResponse> => {
    try {
      const params = new URLSearchParams();
      
      // Filtrar por sucursal si se proporciona
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      // NO filtrar por fecha de creación, obtener TODAS las órdenes
      // y luego filtrar por deliveryDateTime en el cliente
      
      const response = await apiCall<OrderResponse>(`/orders?${params.toString()}`, {
        method: 'GET'
      });
      
      // Filtrar órdenes por fecha de entrega = HOY
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const filteredOrders = (response.data || []).filter((order: any) => {
        // Solo órdenes en producción o con anticipo
        const isProduction = order.sendToProduction === true || 
                           (order.advance && order.advance > 0) ||
                           order.status === 'pendiente';
        
        if (!isProduction) return false;
        
        // Filtrar por fecha de entrega = HOY
        if (order.deliveryData && order.deliveryData.deliveryDateTime) {
          const deliveryDate = new Date(order.deliveryData.deliveryDateTime);
          const deliveryDateOnly = new Date(deliveryDate);
          deliveryDateOnly.setHours(0, 0, 0, 0);
          return deliveryDateOnly.getTime() === today.getTime();
        }
        return false;
      });
      
      return {
        ...response,
        data: filteredOrders
      };
    } catch (error) {
      console.error('Error fetching today orders:', error);
      throw error;
    }
  },

  // Obtener órdenes del día siguiente (basado en fecha de entrega)
  getTomorrowOrders: async (filters: ProductionFilters): Promise<OrderResponse> => {
    try {
      const params = new URLSearchParams();
      
      // Filtrar por sucursal si se proporciona
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiCall<OrderResponse>(`/orders?${params.toString()}`, {
        method: 'GET'
      });
      
      // Filtrar órdenes por fecha de entrega = MAÑANA
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const filteredOrders = (response.data || []).filter((order: any) => {
        // Solo órdenes en producción o con anticipo
        const isProduction = order.sendToProduction === true || 
                           (order.advance && order.advance > 0) ||
                           order.status === 'pendiente';
        
        if (!isProduction) return false;
        
        // Filtrar por fecha de entrega = MAÑANA
        if (order.deliveryData && order.deliveryData.deliveryDateTime) {
          const deliveryDate = new Date(order.deliveryData.deliveryDateTime);
          const deliveryDateOnly = new Date(deliveryDate);
          deliveryDateOnly.setHours(0, 0, 0, 0);
          return deliveryDateOnly.getTime() === tomorrow.getTime();
        }
        return false;
      });
      
      return {
        ...response,
        data: filteredOrders
      };
    } catch (error) {
      console.error('Error fetching tomorrow orders:', error);
      throw error;
    }
  },

  // Obtener órdenes posteriores (basado en fecha de entrega)
  getLaterOrders: async (filters: ProductionFilters): Promise<OrderResponse> => {
    try {
      const params = new URLSearchParams();
      
      // Filtrar por sucursal si se proporciona
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await apiCall<OrderResponse>(`/orders?${params.toString()}`, {
        method: 'GET'
      });
      
      // Filtrar órdenes por fecha de entrega >= PASADO MAÑANA
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(0, 0, 0, 0);
      
      const filteredOrders = (response.data || []).filter((order: any) => {
        // Solo órdenes en producción o con anticipo
        const isProduction = order.sendToProduction === true || 
                           (order.advance && order.advance > 0) ||
                           order.status === 'pendiente';
        
        if (!isProduction) return false;
        
        // Filtrar por fecha de entrega >= PASADO MAÑANA
        if (order.deliveryData && order.deliveryData.deliveryDateTime) {
          const deliveryDate = new Date(order.deliveryData.deliveryDateTime);
          const deliveryDateOnly = new Date(deliveryDate);
          deliveryDateOnly.setHours(0, 0, 0, 0);
          return deliveryDateOnly.getTime() >= dayAfterTomorrow.getTime();
        }
        return false;
      });
      
      return {
        ...response,
        data: filteredOrders
      };
    } catch (error) {
      console.error('Error fetching later orders:', error);
      throw error;
    }
  },

  // Obtener todas las órdenes de producción sin paginación para exportar
  getAllProductionOrders: async (branchId?: string) => {
    try {
      // Preparar parámetros para obtener TODAS las órdenes sin filtro de fecha
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      params.append('limit', '10000'); // Límite muy alto para obtener todas las órdenes
      // NO agregamos filtros de fecha para obtener órdenes de cualquier fecha de creación
      
      // Obtener TODAS las órdenes sin importar cuando fueron creadas
      const response = await apiCall<OrderResponse>(`/orders?${params.toString()}`, { method: 'GET' });
      
      // Filtrar solo órdenes que están en producción o tienen anticipo
      const allOrders = (response.data || []).filter((order: any) => 
        order.sendToProduction === true || 
        (order.advance && order.advance > 0) ||
        order.status === 'pendiente'
      );

      // Fechas para clasificación
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(0, 0, 0, 0);

      // Clasificar las órdenes según deliveryData.deliveryDateTime
      const todayOrders: any[] = [];
      const tomorrowOrders: any[] = [];
      const laterOrders: any[] = [];

      allOrders.forEach((order: any) => {
        if (order.deliveryData && order.deliveryData.deliveryDateTime) {
          const deliveryDate = new Date(order.deliveryData.deliveryDateTime);
          const deliveryDateOnly = new Date(deliveryDate);
          deliveryDateOnly.setHours(0, 0, 0, 0);
          
          if (deliveryDateOnly.getTime() === today.getTime()) {
            todayOrders.push(order);
          } else if (deliveryDateOnly.getTime() === tomorrow.getTime()) {
            tomorrowOrders.push(order);
          } else if (deliveryDateOnly.getTime() >= dayAfterTomorrow.getTime()) {
            laterOrders.push(order);
          }
        }
      });

      // Ordenar cada grupo por hora de entrega
      const sortByDeliveryTime = (a: any, b: any) => {
        const dateA = new Date(a.deliveryData.deliveryDateTime);
        const dateB = new Date(b.deliveryData.deliveryDateTime);
        return dateA.getTime() - dateB.getTime();
      };

      todayOrders.sort(sortByDeliveryTime);
      tomorrowOrders.sort(sortByDeliveryTime);
      laterOrders.sort(sortByDeliveryTime);

      return {
        todayOrders,
        tomorrowOrders,
        laterOrders
      };
    } catch (error) {
      console.error('Error fetching all production orders:', error);
      throw error;
    }
  },
};