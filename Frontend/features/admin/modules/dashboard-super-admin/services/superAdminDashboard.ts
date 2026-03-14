import { apiCall } from "@/utils/api";
import {
  CompanySessionSummary,
  CompanyBranchesResponse,
  BranchUserSession,
} from "../types";

export const superAdminDashboardService = {
  async getCompaniesSummary() {
    const response = await apiCall<CompanySessionSummary[]>(
      "/user-session-logs/companies-summary",
      { method: "GET" }
    );
    return response;
  },

  async getCompanyBranchesStats(companyId: string) {
    const response = await apiCall<CompanyBranchesResponse>(
      `/user-session-logs/company/${companyId}/branches-stats`,
      { method: "GET" }
    );
    return response;
  },

  async getBranchUsersStats(branchId: string) {
    const response = await apiCall<BranchUserSession[]>(
      `/user-session-logs/branch/${branchId}/users-stats`,
      { method: "GET" }
    );
    return response;
  },
};
