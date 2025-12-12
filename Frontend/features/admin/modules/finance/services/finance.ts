import { apiCall } from "@/utils/api";
import { FinanceFilters, FinanceStats, IncomeStats, Payment, OrderPayment, DiscountedSale, Buy, Expense } from "../types";

export const financeService = {
  getFinanceStats: async (filters: FinanceFilters) => {
    const queryParams = new URLSearchParams();

    queryParams.append("startDate", filters.startDate);
    queryParams.append("endDate", filters.endDate);

    if (filters.clientIds && filters.clientIds.length > 0) {
      filters.clientIds.forEach((clientId) => {
        queryParams.append("clientIds[]", clientId);
      });
    }

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      filters.paymentMethods.forEach((method) => {
        queryParams.append("paymentMethods[]", method);
      });
    }

    const response = await apiCall<FinanceStats>(
      `/finance/stats?${queryParams.toString()}`
    );
    return response;
  },

  getIncomeStats: async (filters: FinanceFilters) => {
    const queryParams = new URLSearchParams();

    // Si hay branchId (sucursal específica seleccionada), enviarlo
    if (filters.branchId) {
      queryParams.append("branchId", filters.branchId);
    }

    queryParams.append("startDate", filters.startDate);
    queryParams.append("endDate", filters.endDate);

    if (filters.clientIds && filters.clientIds.length > 0) {
      filters.clientIds.forEach((clientId) => {
        queryParams.append("clientIds[]", clientId);
      });
    }

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      filters.paymentMethods.forEach((method) => {
        queryParams.append("paymentMethods[]", method);
      });
    }

    if (filters.cashierId) {
      queryParams.append("cashierId", filters.cashierId);
    }

    const response = await apiCall<IncomeStats[]>(
      `/finance/income-stats?${queryParams.toString()}`
    );
    return response;
  },

  getPayments: async (filters: FinanceFilters) => {
    const queryParams = new URLSearchParams();

    queryParams.append("startDate", filters.startDate);
    queryParams.append("endDate", filters.endDate);

    if (filters.clientIds && filters.clientIds.length > 0) {
      filters.clientIds.forEach((clientId) => {
        queryParams.append("clientIds[]", clientId);
      });
    }

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      filters.paymentMethods.forEach((method) => {
        queryParams.append("paymentMethods[]", method);
      });
    }

    const response = await apiCall<Payment[]>(
      `/finance/payments?${queryParams.toString()}`
    );
    return response;
  },

  getOrderPaymentsByBranch: async (filters: FinanceFilters) => {
    const queryParams = new URLSearchParams();

    // Si hay branchId (sucursal específica seleccionada), enviarlo
    // Si no hay branchId, el backend buscará automáticamente según el rol del usuario
    if (filters.branchId) {
      queryParams.append("branchId", filters.branchId);
    }

    queryParams.append("startDate", filters.startDate);
    queryParams.append("endDate", filters.endDate);

    if (filters.clientIds && filters.clientIds.length > 0) {
      filters.clientIds.forEach((clientId) => {
        queryParams.append("clientIds[]", clientId);
      });
    }

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      filters.paymentMethods.forEach((method) => {
        queryParams.append("paymentMethods[]", method);
      });
    }

    if (filters.cashierId) {
      queryParams.append("cashierId", filters.cashierId);
    }

    const response = await apiCall<OrderPayment[]>(
      `/order-payments/by-branch?${queryParams.toString()}`
    );
    return response;
  },

  getDiscountedSales: async (filters: FinanceFilters) => {
    const queryParams = new URLSearchParams();

    // Si hay branchId (sucursal específica seleccionada), enviarlo
    // Si no hay branchId, el backend buscará automáticamente según el rol del usuario
    if (filters.branchId) {
      queryParams.append("branchId", filters.branchId);
    }

    queryParams.append("startDate", filters.startDate);
    queryParams.append("endDate", filters.endDate);

    if (filters.clientIds && filters.clientIds.length > 0) {
      filters.clientIds.forEach((clientId) => {
        queryParams.append("clientIds[]", clientId);
      });
    }

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      filters.paymentMethods.forEach((method) => {
        queryParams.append("paymentMethods[]", method);
      });
    }

    const response = await apiCall<DiscountedSale[]>(
      `/finance/discounted-sales?${queryParams.toString()}`
    );
    return response;
  },

  getBuysByBranch: async (filters: FinanceFilters) => {
    const queryParams = new URLSearchParams();

    // Si hay branchId (sucursal específica seleccionada), enviarlo
    // Si no hay branchId, el backend buscará automáticamente según el rol del usuario
    if (filters.branchId) {
      queryParams.append("branchId", filters.branchId);
    }

    queryParams.append("startDate", filters.startDate);
    queryParams.append("endDate", filters.endDate);

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      filters.paymentMethods.forEach((method) => {
        queryParams.append("paymentMethods[]", method);
      });
    }

    const response = await apiCall<Buy[]>(
      `/finance/buys?${queryParams.toString()}`
    );
    return response;
  },

  getExpensesByBranch: async (filters: FinanceFilters) => {
    const queryParams = new URLSearchParams();

    // Si hay branchId (sucursal específica seleccionada), enviarlo
    // Si no hay branchId, el backend buscará automáticamente según el rol del usuario
    if (filters.branchId) {
      queryParams.append("branchId", filters.branchId);
    }

    queryParams.append("startDate", filters.startDate);
    queryParams.append("endDate", filters.endDate);

    const response = await apiCall<Expense[]>(
      `/finance/expenses?${queryParams.toString()}`
    );
    return response;
  },
};
