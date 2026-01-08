export interface CompanySales {
  companyId: string;
  companyName: string;
  isFranchise: boolean;
  totalBranches: number;
  totalSales: number;
  totalPaid: number;
  royalties: number; // Porcentaje promedio ponderado
  royaltiesAmount: number; // Monto total de regalías
  brandAdvertising: number; // Porcentaje promedio ponderado
  brandAdvertisingAmount: number; // Monto total de publicidad de marca
  branchAdvertising: number; // Porcentaje promedio ponderado  
  branchAdvertisingAmount: number; // Monto total de publicidad de sucursal
}

export interface CompanySalesSummary {
  totalCompanies: number;
  totalSales: number;
  totalPaid: number;
  totalRoyalties: number;
  totalBrandAdvertising: number;
  totalBranchAdvertising: number;
}

export interface CompanySalesResponse {
  success: boolean;
  data: CompanySales[];
  summary: CompanySalesSummary;
}

export interface BranchSales {
  branchId: string;
  branchName: string;
  branchCode: string;
  totalOrders: number;
  totalSales: number;
  totalPaid: number;
  royaltiesPercentage: number;
  royaltiesAmount: number;
  brandAdvertisingPercentage: number;
  brandAdvertisingAmount: number;
  branchAdvertisingPercentage: number;
  branchAdvertisingAmount: number;
}

export interface CompanyDetailData {
  company: {
    _id: string;
    name: string;
    isFranchise: boolean;
  };
  branches: BranchSales[];
  summary: {
    totalBranches: number;
    totalSales: number;
    totalPaid: number;
    totalRoyalties: number;
    totalBrandAdvertising: number;
    totalBranchAdvertising: number;
  };
}

export interface CompanyDetailResponse {
  success: boolean;
  data: CompanyDetailData;
}