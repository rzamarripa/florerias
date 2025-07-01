import { apiCall, ApiResponse } from "@/utils/api";

export interface InvoicesPackage {
    _id: string;
    facturas: ImportedInvoice[];
    packageCompanyId?: string;
    estatus: string;
    usuario_id: string;
    fechaCreacion: string;
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

export interface ImportedInvoice {
    _id: string;
    uuid: string;
    rfcEmisor: string;
    nombreEmisor: string;
    rfcReceptor: string;
    nombreReceptor: string;
    rfcProveedorCertificacion: string;
    fechaEmision: string;
    fechaCertificacionSAT: string;
    fechaCancelacion?: string;
    importeAPagar: number;
    tipoComprobante: string;
    estatus: number;
    folio?: string;
    serie?: string;
    formaPago?: string;
    metodoPago?: string;
    importePagado: number;
    estadoPago: number | null;
    esCompleta: boolean;
    descripcionPago?: string;
    autorizada: boolean;
    pagoRechazado: boolean;
    fechaRevision?: string;
    estaRegistrada?: boolean;
    razonSocial: {
        _id: string;
        name: string;
        rfc: string;
    };
}

export interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

export interface InvoicesResponse {
    success: boolean;
    data: ImportedInvoice[];
    additionalInfo?: {
        provider?: {
            name: string;
            rfc: string;
            email: string;
        };
        company?: {
            name: string;
            rfc: string;
        };
    };
    pagination: Pagination;
}

export interface InvoicesSummaryResponse {
    success: boolean;
    data: {
        totalFacturas: number;
        facturasCanceladas: number;
        facturasPendientes: number;
        facturasEnviadas: number;
        facturasPagadas: number;
        facturasRegistradas: number;
        totalImporteAPagar: number;
        totalPagado: number;
        totalSaldo: number;
    };
}

export interface InvoicesPackageResponse {
    success: boolean;
    data: InvoicesPackage;
    message?: string;
}

export interface InvoicesPackagesResponse {
    success: boolean;
    data: InvoicesPackage[];
    pagination: Pagination;
}

export interface InvoicesPackageSummaryResponse {
    success: boolean;
    data: {
        total: number;
        borradores: number;
        enviados: number;
        aprobados: number;
        pagados: number;
        vencidos: number;
    };
}

// Servicio para obtener facturas filtradas por proveedor y empresa
export const getInvoicesByProviderAndCompany = async (params: {
    providerIds?: string; // IDs de proveedores separados por coma
    rfcProvider?: string;
    rfcCompany?: string;
    startDate?: string; // Fecha de inicio en formato ISO
    endDate?: string; // Fecha de fin en formato ISO
    page?: number;
    limit?: number;
    estatus?: string;
    estadoPago?: string;
    sortBy?: string;
    order?: string;
}): Promise<any> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const response = await apiCall<any>(`/imported-invoices/by-provider-company?${queryParams}`);
    return response;
};

// Servicio para obtener resumen de facturas por proveedor y empresa
export const getInvoicesSummaryByProviderAndCompany = async (params: {
    rfcProvider?: string;
    rfcCompany?: string;
    startDate?: string; // Fecha de inicio en formato ISO
    endDate?: string; // Fecha de fin en formato ISO
}): Promise<any> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const response = await apiCall<any>(`/imported-invoices/summary-by-provider-company?${queryParams}`);
    return response;
};

// Servicio para crear un paquete de facturas
export const createInvoicesPackage = async (data: {
    facturas: string[];
    usuario_id: string;
    departamento_id: string;
    departamento: string;
    comentario?: string;
    fechaPago: string;
    totalImporteAPagar?: number;
    // Nuevos campos para la relación
    companyId?: string;
    brandId?: string;
    branchId?: string;
}): Promise<InvoicesPackageResponse> => {
    const response = await apiCall<InvoicesPackageResponse>("/invoices-package", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Servicio para obtener todos los paquetes
export const getInvoicesPackages = async (params: {
    page?: number;
    limit?: number;
    estatus?: string;
    usuario_id?: string;
    departamento_id?: string;
    sortBy?: string;
    order?: string;
}): Promise<InvoicesPackagesResponse> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const response = await apiCall<InvoicesPackagesResponse>(`/invoices-package?${queryParams}`);
    return response.data;
};

// Servicio para obtener un paquete específico
export const getInvoicesPackageById = async (id: string): Promise<ApiResponse<InvoicesPackageResponse>> => {
    const response = await apiCall<InvoicesPackageResponse>(`/invoices-package/${id}`, {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });
    return response;
};

// Servicio para actualizar un paquete
export const updateInvoicesPackage = async (id: string, data: {
    facturas?: string[];
    estatus?: string;
    departamento_id?: string;
    departamento?: string;
    comentario?: string;
    fechaPago?: string;
    totalImporteAPagar?: number;
    // Nuevos campos para la relación
    companyId?: string;
    brandId?: string;
    branchId?: string;
}): Promise<InvoicesPackageResponse> => {
    const response = await apiCall<InvoicesPackageResponse>(`/invoices-package/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Servicio para eliminar un paquete
export const deleteInvoicesPackage = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/invoices-package/${id}`, {
        method: "DELETE",
    });
    return response;
};

// Servicio para obtener resumen de paquetes
export const getInvoicesPackagesSummary = async (usuario_id?: string): Promise<InvoicesPackageSummaryResponse> => {
    const queryParams = new URLSearchParams();
    if (usuario_id) {
        queryParams.append('usuario_id', usuario_id);
    }

    const response = await apiCall<InvoicesPackageSummaryResponse>(`/invoices-package/summary?${queryParams}`);
    return response.data;
};

// Servicio para cambiar estatus de un paquete
export const changeInvoicesPackageStatus = async (id: string, estatus: string): Promise<InvoicesPackageResponse> => {
    const response = await apiCall<InvoicesPackageResponse>(`/invoices-package/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ estatus }),
    });
    return response.data;
};

// Servicio para obtener paquetes vencidos
export const getVencidosInvoicesPackages = async (): Promise<InvoicesPackagesResponse> => {
    const response = await apiCall<InvoicesPackagesResponse>("/invoices-package/vencidos");
    return response.data;
};

// Servicio para marcar factura como pagada completamente
export async function markInvoiceAsFullyPaid(invoiceId: string, descripcion: string) {
    const response = await apiCall(`/imported-invoices/${invoiceId}/mark-as-paid`, {
        method: "PUT",
        body: JSON.stringify({ descripcion }),
    });
    return response;
}

// Servicio para marcar factura como pagada parcialmente
export async function markInvoiceAsPartiallyPaid(invoiceId: string, descripcion: string, monto: number) {
    const response = await apiCall(`/imported-invoices/${invoiceId}/partial-payment`, {
        method: "PUT",
        body: JSON.stringify({ descripcion, monto }),
    });
    return response;
}

// Servicio para obtener paquetes por usuario
export const getInvoicesPackagesByUsuario = async (usuario_id: string): Promise<any> => {
    const response = await apiCall<any>(`/invoices-package/by-usuario?usuario_id=${usuario_id}`);
    return response;
};

// Interfaz para la respuesta de toggle de factura autorizada
export interface ToggleFacturaAutorizadaResponse {
    success: boolean;
    data: {
        _id: string;
        autorizada: boolean;
        pagoRechazado: boolean;
        importePagado: number;
    };
    message?: string;
}

// Servicio para cambiar el estado de autorización de una factura
export const toggleFacturaAutorizada = async (facturaId: string): Promise<ApiResponse<ToggleFacturaAutorizadaResponse>> => {
    const response = await apiCall<ToggleFacturaAutorizadaResponse>(`/imported-invoices/${facturaId}/toggle-autorizada`, {
        method: "PATCH",
    });
    return response;
};

// Servicio para actualizar importe a pagar de una factura
export async function updateImporteAPagar(invoiceId: string, nuevoImporte: number, motivo: string, porcentaje: number) {
    const response = await apiCall(`/imported-invoices/${invoiceId}/update-importe-apagar`, {
        method: "PUT",
        body: JSON.stringify({ importeAPagar: nuevoImporte, motivo, porcentaje }),
    });
    return response;
}

// Servicio para obtener una factura individual por ID
export const getInvoiceById = async (id: string): Promise<ApiResponse<ImportedInvoice>> => {
    const response = await apiCall<ImportedInvoice>(`/imported-invoices/${id}`);
    return response;
};

// Servicio para obtener la estructura de visibilidad del usuario para selects
export const getUserVisibilityForSelects = async (userId: string): Promise<{
    companies: Array<{
        _id: string;
        name: string;
        rfc: string;
        legalRepresentative: string;
        address: string;
        isActive: boolean;
        createdAt: string;
    }>;
    brands: Array<{ _id: string; name: string; companyId: string }>;
    branches: Array<{ _id: string; name: string; brandId: string; companyId: string }>;
    hasFullAccess: boolean;
}> => {
    const response = await apiCall<any>(`/role-visibility/${userId}/selects`);
    return response.data;
}; 