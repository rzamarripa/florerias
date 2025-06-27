import { apiCall } from "@/utils/api";

export interface InvoicesPackpageCompany {
    _id: string;
    packpageId: string;
    companyId: {
        _id: string;
        name: string;
        rfc: string;
    };
    brandId?: {
        _id: string;
        name: string;
    };
    branchId?: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoicesPackpageCompanyRequest {
    packpageId: string;
    companyId: string;
    brandId?: string;
    branchId?: string;
}

export interface UpdateInvoicesPackpageCompanyRequest {
    companyId?: string;
    brandId?: string;
    branchId?: string;
}

export interface InvoicesPackpageCompanyResponse {
    success: boolean;
    data: InvoicesPackpageCompany;
    message?: string;
}

export interface InvoicesPackpageCompaniesResponse {
    success: boolean;
    data: InvoicesPackpageCompany[];
    message?: string;
}

// Crear una nueva relación
export const createInvoicesPackpageCompany = async (data: CreateInvoicesPackpageCompanyRequest): Promise<InvoicesPackpageCompanyResponse> => {
    const response = await apiCall<InvoicesPackpageCompanyResponse>("/invoices-packpage-company", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Obtener relación por packpageId
export const getInvoicesPackpageCompanyByPackpageId = async (packpageId: string): Promise<InvoicesPackpageCompanyResponse> => {
    const response = await apiCall<InvoicesPackpageCompanyResponse>(`/invoices-packpage-company/packpage/${packpageId}`);
    return response.data;
};

// Actualizar una relación existente
export const updateInvoicesPackpageCompany = async (id: string, data: UpdateInvoicesPackpageCompanyRequest): Promise<InvoicesPackpageCompanyResponse> => {
    const response = await apiCall<InvoicesPackpageCompanyResponse>(`/invoices-packpage-company/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Eliminar una relación
export const deleteInvoicesPackpageCompany = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/invoices-packpage-company/${id}`, {
        method: "DELETE",
    });
    return response.data;
};

// Obtener relaciones por companyId
export const getInvoicesPackpageCompanyByCompanyId = async (companyId: string): Promise<InvoicesPackpageCompaniesResponse> => {
    const response = await apiCall<InvoicesPackpageCompaniesResponse>(`/invoices-packpage-company/company/${companyId}`);
    return response.data;
};

// Obtener relaciones por brandId
export const getInvoicesPackpageCompanyByBrandId = async (brandId: string): Promise<InvoicesPackpageCompaniesResponse> => {
    const response = await apiCall<InvoicesPackpageCompaniesResponse>(`/invoices-packpage-company/brand/${brandId}`);
    return response.data;
};

// Obtener relaciones por branchId
export const getInvoicesPackpageCompanyByBranchId = async (branchId: string): Promise<InvoicesPackpageCompaniesResponse> => {
    const response = await apiCall<InvoicesPackpageCompaniesResponse>(`/invoices-packpage-company/branch/${branchId}`);
    return response.data;
}; 