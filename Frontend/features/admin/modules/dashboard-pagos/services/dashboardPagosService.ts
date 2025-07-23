import { apiCall } from "@/utils/api";

// Tipos para la respuesta del presupuesto
export interface BudgetItem {
  _id: string;
  routeId?: {
    _id: string;
    name: string;
  } | null;
  brandId: {
    _id: string;
    name: string;
  };
  companyId: {
    _id: string;
    name: string;
  };
  branchId: {
    _id: string;
    name: string;
  };
  categoryId: {
    _id: string;
    name: string;
    hasRoutes: boolean;
  };
  assignedAmount: number;
  month: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para los paquetes de facturas
export interface InvoicesPackage {
  _id: string;
  facturas: any[];
  pagosEfectivo?: any[];
  estatus: string;
  usuario_id: string;
  departamento_id: string;
  departamento: string;
  totalImporteAPagar: number;
  totalPagado: number;
  comentario?: string;
  fechaPago: string;
  folio: number;
  totalFacturas: number;
  createdAt: string;
  updatedAt: string;
  // Información de la relación Company, Brand, Branch
  companyInfo?: {
    companyId: string;
    companyName: string;
    brandId?: string;
    brandName?: string;
    branchId?: string;
    branchName?: string;
  };
}

// Tipos para la respuesta de paquetes enviados
export interface PaquetesEnviadosResponse {
  totalPaquetes: number;
  totalPagado: number;
  paquetes: InvoicesPackage[];
}

// Tipos para la estructura de visibilidad del usuario
export interface VisibilityCompany {
  _id: string;
  name: string;
  rfc: string;
  legalRepresentative: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface VisibilityBrand {
  _id: string;
  name: string;
  companyId: string;
}

export interface VisibilityBranch {
  _id: string;
  name: string;
  brandId: string;
  companyId: string;
}

export interface UserVisibilityStructure {
  companies: VisibilityCompany[];
  brands: VisibilityBrand[];
  branches: VisibilityBranch[];
  hasFullAccess: boolean;
}

// Tipos para la relación paquete-sucursal/marca
export interface PackageCompanyRelation {
  _id: string;
  packageId: string;
  companyId: string;
  brandId?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

// Función para obtener presupuesto por compañía, marca, sucursal y mes
export const getBudgetByCompanyBrandBranch = async (params: {
  companyId: string;
  brandId: string;
  branchId: string;
  month: string;
}): Promise<BudgetItem[]> => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const response = await apiCall<BudgetItem[]>(`/invoices-package/budget?${queryParams}`);

  // La respuesta viene en response.data que es el array de presupuestos
  return response.data || [];
};

// Función para obtener presupuesto por compañía y mes (específico para dashboard de pagos)
export const getBudgetByCompanyForDashboard = async (params: {
  companyId: string;
  month: string;
}): Promise<BudgetItem[]> => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const response = await apiCall<BudgetItem[]>(`/invoices-package/budget-dashboard?${queryParams}`);

  // La respuesta viene en response.data que es el array de presupuestos
  return response.data || [];
};

// Función para obtener paquetes enviados para dashboard de pagos
export const getPaquetesEnviados = async (params: {
  usuario_id: string;
  companyId?: string;
  year?: number;
  month?: number;
}): Promise<PaquetesEnviadosResponse> => {
  const queryParams = new URLSearchParams();

  // Agregar usuario_id como parámetro obligatorio
  queryParams.append('usuario_id', params.usuario_id);

  // Agregar filtros opcionales
  if (params.companyId) queryParams.append('companyId', params.companyId);
  if (params.year) queryParams.append('year', params.year.toString());
  if (params.month !== undefined) queryParams.append('month', params.month.toString());

  const response = await apiCall<PaquetesEnviadosResponse>(`/invoices-package/paquetes-enviados-dashboard?${queryParams}`);

  return response.data || {
    totalPaquetes: 0,
    totalPagado: 0,
    paquetes: []
  };
};

// Servicio para obtener la estructura de visibilidad del usuario para selects
export const getUserVisibilityForSelects = async (userId: string): Promise<UserVisibilityStructure> => {
  const response = await apiCall<UserVisibilityStructure>(`/role-visibility/${userId}/selects`);
  return response.data;
};

// Obtener presupuesto asignado por sucursal (o todas) para un mes
export const getBudgetByBranch = async (params: {
  companyId: string;
  branchId?: string;
  month: string;
}): Promise<number> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  const response = await apiCall<{ assignedAmount: number }>(`/budget/by-branch?${queryParams}`);
  return response.data?.assignedAmount || 0;
};

// Función para obtener presupuesto por sucursal-marca (basado en la lógica del Budget page)
export const getBudgetByBranchBrand = async (params: {
  companyId: string;
  brandId: string;
  branchId: string;
  month: string;
}): Promise<BudgetItem[]> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const response = await apiCall<BudgetItem[]>(`/invoices-package/budget?${queryParams}`);
  return response.data || [];
};

// Función para obtener presupuestos por sucursal para el dashboard de pagos
export const getBudgetByBranchesForDashboard = async (params: {
  companyId: string;
  brandIds: string[];
  month: string;
  userId?: string;
}): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('companyId', params.companyId);
    queryParams.append('brandIds', params.brandIds.join(','));
    queryParams.append('month', params.month);
    if (params.userId) {
      queryParams.append('userId', params.userId);
    }

    const response = await apiCall<any[]>(`/budget/by-company-branches?${queryParams}`);
    console.log('Respuesta del endpoint:', response.data);

    if (!response.data) {
      return [];
    }

    return response.data;
  } catch (error) {
    console.error('Error obteniendo presupuestos por sucursal:', error);
    return [];
  }
};

// Función para obtener las relaciones paquete-sucursal/marca
export const getPackageCompanyRelations = async (packageIds: string[]): Promise<PackageCompanyRelation[]> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('packageIds', packageIds.join(','));

    const response = await apiCall<PackageCompanyRelation[]>(`/invoices-package/package-company-relations?${queryParams}`);
    return response.data || [];
  } catch (error) {
    console.error('Error obteniendo relaciones paquete-sucursal/marca:', error);
    return [];
  }
};