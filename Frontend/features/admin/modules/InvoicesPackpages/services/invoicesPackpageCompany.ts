import { apiCall } from "@/utils/api";

export interface InvoicesPackageCompany {
    _id: string;
    packageId: string;
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

export interface CreateInvoicesPackageCompanyRequest {
    packageId: string;
    companyId: string;
    brandId?: string;
    branchId?: string;
}

export interface UpdateInvoicesPackageCompanyRequest {
    companyId?: string;
    brandId?: string;
    branchId?: string;
}

export interface InvoicesPackageCompanyResponse {
    success: boolean;
    data: InvoicesPackageCompany;
    message?: string;
}

export interface InvoicesPackageCompaniesResponse {
    success: boolean;
    data: InvoicesPackageCompany[];
    message?: string;
}

// Crear una nueva relación
export const createInvoicesPackageCompany = async (data: CreateInvoicesPackageCompanyRequest): Promise<InvoicesPackageCompanyResponse> => {
    const response = await apiCall<InvoicesPackageCompanyResponse>("/invoices-package-company", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Obtener relación por packageId
export const getInvoicesPackageCompanyByPackageId = async (packageId: string): Promise<InvoicesPackageCompanyResponse> => {
    const response = await apiCall<InvoicesPackageCompanyResponse>(`/invoices-package-company/package/${packageId}`);
    return response.data;
};

// Actualizar una relación existente
export const updateInvoicesPackageCompany = async (id: string, data: UpdateInvoicesPackageCompanyRequest): Promise<InvoicesPackageCompanyResponse> => {
    const response = await apiCall<InvoicesPackageCompanyResponse>(`/invoices-package-company/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Eliminar una relación
export const deleteInvoicesPackageCompany = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/invoices-package-company/${id}`, {
        method: "DELETE",
    });
    return response.data;
};

// Obtener relaciones por companyId
export const getInvoicesPackageCompanyByCompanyId = async (companyId: string): Promise<InvoicesPackageCompaniesResponse> => {
    const response = await apiCall<InvoicesPackageCompaniesResponse>(`/invoices-package-company/company/${companyId}`);
    return response.data;
};

// Obtener relaciones por brandId
export const getInvoicesPackageCompanyByBrandId = async (brandId: string): Promise<InvoicesPackageCompaniesResponse> => {
    const response = await apiCall<InvoicesPackageCompaniesResponse>(`/invoices-package-company/brand/${brandId}`);
    return response.data;
};

// Obtener relaciones por branchId
export const getInvoicesPackageCompanyByBranchId = async (branchId: string): Promise<InvoicesPackageCompaniesResponse> => {
    const response = await apiCall<InvoicesPackageCompaniesResponse>(`/invoices-package-company/branch/${branchId}`);
    return response.data;
}; 