import { apiCall } from '@/utils/api';
import { ImportedInvoice, SummaryData, RawInvoiceData, Pagination } from '../types';

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
    receiverTaxId: string;
    status?: '0' | '1';
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<GetInvoicesResponse> => {
    try {
      const { page = 1, limit = 15, receiverTaxId, status, sortBy = 'issuanceDate', order = 'desc' } = params;
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        receiverTaxId,
        sortBy,
        order,
        ...(status && { status }),
      });
      
      const response = await apiCall<ImportedInvoice[]>(`/imported-invoices?${searchParams}`);
      return response as GetInvoicesResponse;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 15 }
      };
    }
  },

  // Obtener resumen de facturas para una razón social
  getSummary: async (receiverTaxId: string): Promise<GetSummaryResponse> => {
    try {
      const response = await apiCall<SummaryData>(`/imported-invoices/summary?receiverTaxId=${receiverTaxId}`);
      return response as GetSummaryResponse;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: { totalInvoices: 0, cancelledInvoices: 0, uniqueProviders: 0 }
      };
    }
  },

  // Importar facturas en lote desde archivo ZIP
  bulkUpsert: async (invoices: RawInvoiceData[]): Promise<BulkUpsertResponse> => {
    try {
      const response = await apiCall<{ inserted: number; updated: number }>('/imported-invoices/bulk-upsert', {
        method: 'POST',
        body: JSON.stringify(invoices),
      });
      return response as BulkUpsertResponse;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: { inserted: 0, updated: 0 }
      };
    }
  },

  // Obtener una factura específica por ID
  getById: async (id: string): Promise<{ success: boolean; data: ImportedInvoice | null; message?: string }> => {
    try {
      const response = await apiCall<ImportedInvoice>(`/imported-invoices/${id}`);
      return response;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: null
      };
    }
  },

  // Buscar facturas por filtros avanzados
  search: async (params: {
    receiverTaxId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: '0' | '1';
    voucherType?: 'I' | 'E' | 'P';
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<GetInvoicesResponse> => {
    try {
      const { 
        page = 1, 
        limit = 15, 
        receiverTaxId, 
        search, 
        status, 
        voucherType, 
        startDate, 
        endDate, 
        minAmount, 
        maxAmount 
      } = params;
      
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        receiverTaxId,
        ...(search && { search }),
        ...(status && { status }),
        ...(voucherType && { voucherType }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(minAmount && { minAmount: minAmount.toString() }),
        ...(maxAmount && { maxAmount: maxAmount.toString() }),
      });
      
      const response = await apiCall<ImportedInvoice[]>(`/imported-invoices/search?${searchParams}`);
      return response as GetInvoicesResponse;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 15 }
      };
    }
  },

  // Exportar facturas a diferentes formatos
  export: async (params: {
    receiverTaxId: string;
    format: 'csv' | 'xlsx' | 'pdf';
    filters?: {
      status?: '0' | '1';
      voucherType?: 'I' | 'E' | 'P';
      startDate?: string;
      endDate?: string;
    };
  }): Promise<{ success: boolean; data: Blob | null; message?: string }> => {
    try {
      const { receiverTaxId, format, filters = {} } = params;
      const searchParams = new URLSearchParams({
        receiverTaxId,
        format,
        ...filters,
      });
      
      const response = await fetch(`/api/v1/imported-invoices/export?${searchParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar las facturas');
      }
      
      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: null
      };
    }
  },

  // Obtener estadísticas avanzadas
  getStatistics: async (receiverTaxId: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<{
    success: boolean;
    data: {
      totalAmount: number;
      averageAmount: number;
      topProviders: Array<{ name: string; count: number; amount: number }>;
      voucherTypeDistribution: Array<{ type: string; count: number; amount: number }>;
      monthlyTrend: Array<{ month: string; count: number; amount: number }>;
    } | null;
    message?: string;
  }> => {
    try {
      const response = await apiCall<any>(`/imported-invoices/statistics?receiverTaxId=${receiverTaxId}&period=${period}`);
      return response;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: null
      };
    }
  },

  // Validar archivo antes de importar
  validateFile: async (invoices: RawInvoiceData[]): Promise<{
    success: boolean;
    data: {
      valid: number;
      invalid: number;
      errors: Array<{ row: number; field: string; message: string }>;
    } | null;
    message?: string;
  }> => {
    try {
      const response = await apiCall<any>('/imported-invoices/validate', {
        method: 'POST',
        body: JSON.stringify(invoices),
      });
      return response;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: null
      };
    }
  },

  // Eliminar facturas en lote
  bulkDelete: async (invoiceIds: string[]): Promise<{
    success: boolean;
    message: string;
    data: { deleted: number; failed: number };
  }> => {
    try {
      const response = await apiCall<any>('/imported-invoices/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ invoiceIds }),
      });
      return response;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: { deleted: 0, failed: invoiceIds.length }
      };
    }
  },

  // Actualizar estatus de facturas en lote
  bulkUpdateStatus: async (params: {
    invoiceIds: string[];
    status: 0 | 1;
    cancellationDate?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: { updated: number; failed: number };
  }> => {
    try {
      const response = await apiCall<any>('/imported-invoices/bulk-update-status', {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      return response;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message, 
        data: { updated: 0, failed: params.invoiceIds.length }
      };
    }
  },
}; 