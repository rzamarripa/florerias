import { apiCall } from "@/utils/api";
import {
  ReportFilters,
  SalesByProductResponse,
  SalesByCategoryResponse,
} from "../types";

const buildQuery = (filters: ReportFilters) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.branchId) params.append("branchId", filters.branchId);
  return params.toString();
};

export const reportsService = {
  getSalesByProduct: async (
    filters: ReportFilters
  ): Promise<SalesByProductResponse> => {
    const qs = buildQuery(filters);
    const response = await apiCall<SalesByProductResponse["data"]>(
      `/reports/sales-by-product?${qs}`
    );
    return {
      success: response.success,
      data: response.data,
    };
  },

  getSalesByCategory: async (
    filters: ReportFilters
  ): Promise<SalesByCategoryResponse> => {
    const qs = buildQuery(filters);
    const response = await apiCall<SalesByCategoryResponse["data"]>(
      `/reports/sales-by-category?${qs}`
    );
    return {
      success: response.success,
      data: response.data,
    };
  },
};
