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
