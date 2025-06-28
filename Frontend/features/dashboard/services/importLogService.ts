import { apiCall } from "@/utils/api";

export const importLogService = {
  getAccountsStatusToday: async () => {
    return await apiCall("/log-import-bank-movements/accounts-status-today");
  },

  getTodayImports: async () => {
    return await apiCall("/log-import-bank-movements/today");
  },

  getByDate: async (date: string) => {
    return await apiCall(`/log-import-bank-movements/${date}`);
  },

  getToday: async () => {
    return await apiCall("/log-import-bank-movements/today");
  },
};
