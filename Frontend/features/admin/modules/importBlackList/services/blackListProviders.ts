import { apiCall } from "@/utils/api";
import { env } from "@/config/env";
import {
  BlackListProvider,
  SummaryData,
  RawBlackListProviderData,
  Pagination,
} from "../types";

export interface GetProvidersResponse {
  success: boolean;
  data: BlackListProvider[];
  pagination?: Pagination;
  message?: string;
}

export interface GetSummaryResponse {
  success: boolean;
  data: SummaryData;
  message?: string;
}

export interface BulkUpsertResponse {
  success: boolean;
  message: string;
  data: {
    inserted: number;
    updated: number;
  };
}

export const blackListProvidersService = {
  // Obtener proveedores paginados
  getProviders: async (params: {
    page?: number;
    limit?: number;
    rfc?: string;
    nombre?: string;
    situacion?: string;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<GetProvidersResponse> => {
    try {
      const {
        page = 1,
        limit = 15,
        rfc,
        nombre,
        situacion,
        sortBy = "createdAt",
        order = "desc",
      } = params;
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
        ...(rfc && { rfc }),
        ...(nombre && { nombre }),
        ...(situacion && { situacion }),
      });

      const response = await apiCall<BlackListProvider[]>(
        `/blacklist-providers?${searchParams}`
      );
      return response as GetProvidersResponse;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 15 },
      };
    }
  },

  // Obtener resumen de proveedores
  getSummary: async (): Promise<GetSummaryResponse> => {
    try {
      const response = await apiCall<SummaryData>(
        `/blacklist-providers/summary`
      );
      return response as GetSummaryResponse;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: { 
          totalProviders: 0, 
          activeProviders: 0, 
          desvirtualizedProviders: 0, 
          definitiveProviders: 0 
        },
      };
    }
  },

  // Importar proveedores en lote desde archivo XLSX
  bulkUpsert: async (
    providers: RawBlackListProviderData[]
  ): Promise<BulkUpsertResponse> => {
    try {
      const payload = {
        providers,
      };
      const response = await apiCall<{ inserted: number; updated: number }>(
        "/blacklist-providers/bulk-upsert",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      return response as BulkUpsertResponse;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: { inserted: 0, updated: 0 },
      };
    }
  },

  // Obtener un proveedor específico por ID
  getById: async (
    id: string
  ): Promise<{
    success: boolean;
    data: BlackListProvider | null;
    message?: string;
  }> => {
    try {
      const response = await apiCall<BlackListProvider>(
        `/blacklist-providers/${id}`
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  // Verificar si un proveedor está en lista negra por RFC
  checkProvider: async (
    rfc: string
  ): Promise<{
    success: boolean;
    data: {
      inBlackList: boolean;
      provider: BlackListProvider | null;
    } | null;
    message?: string;
  }> => {
    try {
      const response = await apiCall<{
        inBlackList: boolean;
        provider: BlackListProvider | null;
      }>(`/blacklist-providers/check/${rfc}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  // Exportar proveedores a diferentes formatos
  export: async (params: {
    format: "csv" | "xlsx" | "pdf";
    filters?: {
      rfc?: string;
      nombre?: string;
      situacion?: string;
    };
  }): Promise<{ success: boolean; data: Blob | null; message?: string }> => {
    try {
      const { format, filters = {} } = params;
      const searchParams = new URLSearchParams({
        format,
        ...filters,
      });

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/blacklist-providers/export?${searchParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al exportar los proveedores");
      }

      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  // Obtener estadísticas avanzadas
  getStatistics: async (): Promise<{
    success: boolean;
    data: {
      totalProviders: number;
      activeProviders: number;
      desvirtualizedProviders: number;
      definitiveProviders: number;
      situacionDistribution: Array<{
        situacion: string;
        count: number;
      }>;
      monthlyTrend: Array<{
        month: string;
        count: number;
      }>;
    } | null;
    message?: string;
  }> => {
    try {
      const response = await apiCall<any>(
        `/blacklist-providers/statistics`
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },
};