import { apiCall } from '@/utils/api';
import { CompanySalesResponse, CompanyDetailResponse } from '../types';

export const companySalesService = {
  // Obtener resumen de ventas de todas las empresas franquicia
  getCompaniesSalesSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CompanySalesResponse> => {
    const queryParams = new URLSearchParams();
    
    // Siempre filtrar solo franquicias
    queryParams.append('onlyFranchises', 'true');
    
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const queryString = queryParams.toString();
    const url = `/company-sales/summary?${queryString}`;
    
    const response = await apiCall<CompanySalesResponse>(url);
    return response;
  },

  // Obtener detalle de ventas de una empresa específica
  getCompanySalesDetail: async (
    companyId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<CompanyDetailResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const queryString = queryParams.toString();
    const url = `/company-sales/${companyId}/detail${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiCall<CompanyDetailResponse>(url);
    return response;
  },
};