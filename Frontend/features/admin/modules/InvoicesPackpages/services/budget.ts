import { apiCall } from "@/utils/api";

export interface BudgetItem {
    _id: string;
    routeId?: {
        _id: string;
        name: string;
    };
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
        hasRoutes?: boolean;
    };
    assignedAmount: number;
    month: string;
    createdAt: string;
    updatedAt: string;
}

export interface BudgetResponse {
    success: boolean;
    data: BudgetItem[];
    message: string;
}

export interface BudgetValidationResult {
    packageId: string;
    month: string;
    requiereAutorizacion: boolean;
    validaciones: {
        concepto: {
            _id: string;
            name: string;
            categoryName: string;
        };
        presupuestoAsignado: number;
        totalPagado: number;
        diferencia: number;
        excede: boolean;
        pagos: {
            tipo: 'factura' | 'efectivo';
            id: string;
            monto: number;
            descripcion: string;
        }[];
    }[];
    resumen: {
        conceptosValidados: number;
        conceptosExcedidos: number;
        totalExceso: number;
    };
}

export interface BudgetValidationResponse {
    success: boolean;
    data: BudgetValidationResult;
    message: string;
}

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

export const validatePackageBudgetByExpenseConcept = async (packageId: string): Promise<BudgetValidationResult> => {
    const response = await apiCall<BudgetValidationResult>(`/budget/validate-package/${packageId}`);
    
    if (response.data) {
        return response.data;
    } else {
        throw new Error(response.message || 'Error al validar presupuesto por concepto de gasto');
    }
};
