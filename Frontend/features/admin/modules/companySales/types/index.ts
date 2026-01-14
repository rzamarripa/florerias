export interface BranchSalesData {
  branchId: string;
  branchName: string;
  branchCode: string;
  totalOrders: number;
  totalSales: number;
  totalDeliveryService: number; // Total de costos de envío
  totalSalesWithoutDelivery: number; // S/S - Ventas sin servicio
  totalPaid: number;
  royalties: number; // Porcentaje sobre S/S
  royaltiesAmount: number; // Monto de regalías sobre S/S
  brandAdvertising: number; // Porcentaje sobre S/S
  brandAdvertisingAmount: number; // Monto de publicidad de marca sobre S/S
  branchAdvertising: number; // Porcentaje sobre S/S
  branchAdvertisingAmount: number; // Monto de publicidad de sucursal sobre S/S
}

// Mantener CompanySales para compatibilidad temporal
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

export interface BranchSalesSummary {
  totalBranches: number;
  totalSales: number;
  totalDeliveryService: number;
  totalSalesWithoutDelivery: number;
  totalPaid: number;
  totalRoyalties: number;
  totalBrandAdvertising: number;
  totalBranchAdvertising: number;
}

export interface BranchSalesResponse {
  success: boolean;
  data: BranchSalesData[];
  summary: BranchSalesSummary;
}

// Mantener interfaces anteriores para compatibilidad
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