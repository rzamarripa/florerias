import { apiCall, ApiResponse } from "@/utils/api";

export interface CashPaymentEmbedded {
    _id: string;
    importeAPagar: number;
    importePagado: number;
    expenseConcept: {
        _id: string;
        name: string;
        categoryId?: {
            _id: string;
            name: string;
        };
    };
    description?: string;
    createdAt: string;
    // Estados de autorización embebidos
    autorizada?: boolean | null;
    pagoRechazado?: boolean;
    estadoPago?: number | null;
    esCompleta?: boolean;
    registrado?: number;
    pagado?: number;
    descripcionPago?: string;
    fechaRevision?: string | null;
}

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
    // Array de pagos en efectivo embebidos
    pagosEfectivo?: CashPaymentEmbedded[];
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
    autorizada: boolean | null;
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

export const getInvoicesByProviderAndCompany = async (params: {
    providerIds?: string;
    rfcProvider?: string;
    rfcCompany?: string;
    companyId?: string;
    startDate?: string;
    endDate?: string;
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
    providerIds?: string; // IDs de proveedores separados por coma
    rfcProvider?: string;
    rfcCompany?: string;
    companyId?: string; // ID de empresa (método más confiable)
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
    // Nuevo campo para conceptos de gasto por factura
    conceptosGasto?: { [invoiceId: string]: string };
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
    // Nuevo campo para conceptos de gasto por factura
    conceptosGasto?: { [invoiceId: string]: string };
    // Nuevo campo para pagos en efectivo
    pagosEfectivo?: {
        _id?: string;
        importeAPagar: number;
        expenseConcept: {
            _id: string;
            name: string;
            categoryId?: {
                _id: string;
                name: string;
            };
        };
        description?: string;
        createdAt?: string;
    }[];
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
export const changeInvoicesPackageStatus = async (id: string, estatus: string): Promise<any> => {
    const response = await apiCall<any>(`/invoices-package/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ estatus }),
    });
    return response;
};

// Servicio para enviar paquete a dirección
export const enviarPaqueteADireccion = async (id: string): Promise<any> => {
    const response = await apiCall<any>(`/invoices-package/${id}/enviar-direccion`, {
        method: "POST",
    });
    return response;
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

// Servicio para obtener paquetes por usuario (con filtrado por departamento y visibilidad)
export const getInvoicesPackagesByUsuario = async (usuario_id: string): Promise<any> => {
    const response = await apiCall<any>(`/invoices-package/by-usuario?usuario_id=${usuario_id}`);
    return response;
};

// Servicio para obtener paquetes creados por el usuario (sin filtrado de visibilidad)
export const getInvoicesPackagesCreatedByUsuario = async (usuario_id: string): Promise<any> => {
    const response = await apiCall<any>(`/invoices-package/created-by-usuario?usuario_id=${usuario_id}`);
    return response;
};

// Interfaz para la respuesta de toggle de factura autorizada
export interface ToggleFacturaAutorizadaResponse {
    success: boolean;
    data: {
        _id: string;
        autorizada: boolean | null;
        pagoRechazado: boolean;
        importePagado: number;
        estadoPago: number | null;
        esCompleta: boolean;
    };
    message?: string;
}

// Servicio para cambiar el estado de autorización de una factura
export const toggleFacturaAutorizada = async (facturaId: string, autorizada?: boolean, packageId?: string): Promise<ApiResponse<ToggleFacturaAutorizadaResponse>> => {
    const bodyObj: any = {};
    if (typeof autorizada === 'boolean') bodyObj.autorizada = autorizada;
    if (packageId) bodyObj.packageId = packageId;
    const body = Object.keys(bodyObj).length > 0 ? JSON.stringify(bodyObj) : undefined;
    const response = await apiCall<ToggleFacturaAutorizadaResponse>(`/imported-invoices/${facturaId}/toggle-autorizada`, {
        method: "PATCH",
        ...(body ? { body } : {}),
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
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

// Interfaces para folio de autorización
export interface AuthorizationFolio {
    _id: string;
    paquete_id: string;
    motivo: string;
    usuario_id: string;
    fecha: string;
    estatus: string;
    fechaFolioAutorizacion: string;
    folio: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAuthorizationFolioRequest {
    paquete_id: string;
    motivo: string;
    usuario_id: string;
    fecha: string;
    fechaFolioAutorizacion: string;
    folio: string;
}

export interface AuthorizationFolioResponse {
    success: boolean;
    data: AuthorizationFolio;
    message?: string;
}

// Servicio para crear un folio de autorización
export const createAuthorizationFolio = async (data: CreateAuthorizationFolioRequest): Promise<AuthorizationFolioResponse> => {
    const response = await apiCall<AuthorizationFolio>("/authorization-folios", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return {
        success: true,
        data: response.data,
    };
};

// Servicio para obtener folios de autorización por paquete
export const getAuthorizationFoliosByPackage = async (packageId: string): Promise<AuthorizationFolio[]> => {
    const url = `/authorization-folios/by-package/${packageId}`;

    const response = await apiCall<AuthorizationFolio[]>(url);

    return response.data || [];
};

// Servicio para buscar un folio por número
export const getAuthorizationFolioByNumber = async (folioNumber: string): Promise<AuthorizationFolio | null> => {
    const response = await apiCall<AuthorizationFolio[]>(`/authorization-folios?folio=${folioNumber}`);
    return response.data && response.data.length > 0 ? response.data[0] : null;
};

// Servicio para canjear un folio de autorización
export const redeemAuthorizationFolio = async (folioId: string): Promise<{ success: boolean; data: AuthorizationFolio; message: string }> => {
    const response = await apiCall<{ success: boolean; data: AuthorizationFolio; message: string }>(`/authorization-folios/${folioId}/redeem`, {
        method: "POST",
    });

    // La respuesta ya viene con el formato correcto desde el backend
    return response.data;
};

// Interfaces para la información de compañía/marca/sucursal
export interface PackageCompanyInfo {
    _id: string;
    packageId: string;
    companyId: {
        _id: string;
        name: string;
        rfc: string;
        legalRepresentative: string;
        address: string;
        isActive: boolean;
        createdAt: string;
    };
    brandId?: {
        _id: string;
        name: string;
        companyId: string;
        categoryId: string;
        isActive: boolean;
        createdAt: string;
    };
    branchId?: {
        _id: string;
        name: string;
        brandId: string;
        address: string;
        isActive: boolean;
        createdAt: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Servicio para obtener información de compañía/marca/sucursal de un paquete
export const getPackageCompanyInfo = async (packageId: string): Promise<PackageCompanyInfo | null> => {
    try {
        const response = await apiCall<PackageCompanyInfo>(`/invoices-package-company/package/${packageId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener información de compañía del paquete:', error);
        return null;
    }
}; 