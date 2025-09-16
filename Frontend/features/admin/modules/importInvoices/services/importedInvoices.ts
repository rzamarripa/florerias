import { apiCall } from "@/utils/api";
import { env } from "@/config/env";
import {
  ImportedInvoice,
  SummaryData,
  RawInvoiceData,
  Pagination,
} from "../types";

export interface GetInvoicesResponse {
  success: boolean;
  data: ImportedInvoice[];
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

export const importedInvoicesService = {
  // Obtener facturas paginadas para una razón social específica
  getInvoices: async (params: {
    page?: number;
    limit?: number;
    rfcReceptor?: string;
    companyId?: string;
    estatus?: "0" | "1";
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<GetInvoicesResponse> => {
    try {
      const {
        page = 1,
        limit = 15,
        rfcReceptor,
        companyId,
        estatus,
        sortBy = "fechaEmision",
        order = "desc",
      } = params;
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
        ...(companyId && { companyId }),
        ...(rfcReceptor && { rfcReceptor }),
        ...(estatus && { estatus }),
      });

      const response = await apiCall<ImportedInvoice[]>(
        `/imported-invoices?${searchParams}`
      );
      return response as GetInvoicesResponse;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 15 },
      };
    }
  },

  // Obtener resumen de facturas para una razón social
  getSummary: async (params: {
    rfcReceptor?: string;
    companyId?: string;
  }): Promise<GetSummaryResponse> => {
    try {
      const { rfcReceptor, companyId } = params;
      const searchParams = new URLSearchParams({
        ...(companyId && { companyId }),
        ...(rfcReceptor && { rfcReceptor }),
      });

      const response = await apiCall<SummaryData>(
        `/imported-invoices/summary?${searchParams}`
      );
      return response as GetSummaryResponse;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: { totalFacturas: 0, facturasCanceladas: 0, proveedoresUnicos: 0 },
      };
    }
  },

  // Importar facturas en lote desde archivo ZIP
  bulkUpsert: async (
    invoices: RawInvoiceData[],
    companyId?: string,
    providerStatus?: string
  ): Promise<BulkUpsertResponse> => {
    try {
      const payload = {
        invoices,
        companyId,
        providerStatus,
      };
      const response = await apiCall<{ inserted: number; updated: number }>(
        "/imported-invoices/bulk-upsert",
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

  // Obtener una factura específica por ID
  getById: async (
    id: string
  ): Promise<{
    success: boolean;
    data: ImportedInvoice | null;
    message?: string;
  }> => {
    try {
      const response = await apiCall<ImportedInvoice>(
        `/imported-invoices/${id}`
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

  // Buscar facturas por filtros avanzados
  search: async (params: {
    rfcReceptor?: string;
    companyId?: string;
    page?: number;
    limit?: number;
    search?: string;
    estatus?: "0" | "1";
    tipoComprobante?: "I" | "E" | "P";
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<GetInvoicesResponse> => {
    try {
      const {
        page = 1,
        limit = 15,
        rfcReceptor,
        companyId,
        search,
        estatus,
        tipoComprobante,
        startDate,
        endDate,
        minAmount,
        maxAmount,
      } = params;

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(companyId && { companyId }),
        ...(rfcReceptor && { rfcReceptor }),
        ...(search && { search }),
        ...(estatus && { estatus }),
        ...(tipoComprobante && { tipoComprobante }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(minAmount && { minAmount: minAmount.toString() }),
        ...(maxAmount && { maxAmount: maxAmount.toString() }),
      });

      const response = await apiCall<ImportedInvoice[]>(
        `/imported-invoices/search?${searchParams}`
      );
      return response as GetInvoicesResponse;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 15 },
      };
    }
  },

  // Exportar facturas a diferentes formatos
  export: async (params: {
    rfcReceptor?: string;
    companyId?: string;
    format: "csv" | "xlsx" | "pdf";
    filters?: {
      estatus?: "0" | "1";
      tipoComprobante?: "I" | "E" | "P";
      startDate?: string;
      endDate?: string;
    };
  }): Promise<{ success: boolean; data: Blob | null; message?: string }> => {
    try {
      const { rfcReceptor, companyId, format, filters = {} } = params;
      const searchParams = new URLSearchParams({
        format,
        ...(companyId && { companyId }),
        ...(rfcReceptor && { rfcReceptor }),
        ...filters,
      });

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/imported-invoices/export?${searchParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al exportar las facturas");
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
  getStatistics: async (params: {
    rfcReceptor?: string;
    companyId?: string;
    period?: "month" | "quarter" | "year";
  }): Promise<{
    success: boolean;
    data: {
      importeAPagarTotal: number;
      importeAPagarPromedio: number;
      topProviders: Array<{
        name: string;
        count: number;
        importeAPagar: number;
      }>;
      tipoComprobanteDistribution: Array<{
        type: string;
        count: number;
        importeAPagar: number;
      }>;
      monthlyTrend: Array<{
        month: string;
        count: number;
        importeAPagar: number;
      }>;
    } | null;
    message?: string;
  }> => {
    try {
      const { rfcReceptor, companyId, period = "month" } = params;
      const searchParams = new URLSearchParams({
        period,
        ...(companyId && { companyId }),
        ...(rfcReceptor && { rfcReceptor }),
      });

      const response = await apiCall<any>(
        `/imported-invoices/statistics?${searchParams}`
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

  // Validar archivo antes de importar
  validateFile: async (
    invoices: RawInvoiceData[]
  ): Promise<{
    success: boolean;
    data: {
      valid: number;
      invalid: number;
      errors: Array<{ row: number; field: string; message: string }>;
    } | null;
    message?: string;
  }> => {
    try {
      const response = await apiCall<any>("/imported-invoices/validate", {
        method: "POST",
        body: JSON.stringify(invoices),
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  // Eliminar facturas en lote
  bulkDelete: async (
    invoiceIds: string[]
  ): Promise<{
    success: boolean;
    message: string;
    data: { deleted: number; failed: number };
  }> => {
    try {
      const response = await apiCall<any>("/imported-invoices/bulk-delete", {
        method: "DELETE",
        body: JSON.stringify({ invoiceIds }),
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: { deleted: 0, failed: invoiceIds.length },
      };
    }
  },

  // Actualizar estatus de facturas en lote
  bulkUpdateStatus: async (params: {
    invoiceIds: string[];
    estatus: 0 | 1;
    fechaCancelacion?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: { updated: number; failed: number };
  }> => {
    try {
      const response = await apiCall<any>(
        "/imported-invoices/bulk-update-status",
        {
          method: "PUT",
          body: JSON.stringify(params),
        }
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: { updated: 0, failed: params.invoiceIds.length },
      };
    }
  },
};
