export interface CompanySessionSummary {
  _id: string;
  legalName: string;
  tradeName: string;
  logoUrl?: string;
  totalSessionHours: number;
}

export interface BranchSessionStats {
  _id: string;
  branchName: string;
  branchCode: string;
  totalHours: number;
  closedSessionHours: number;
  activeSessionHours: number;
}

export interface CompanyBranchesResponse {
  companyName: string;
  branches: BranchSessionStats[];
}

export interface BranchUserSession {
  _id: string;
  username: string;
  email: string;
  roleName: string;
  totalUsageHours: number;
  isManager: boolean;
}
