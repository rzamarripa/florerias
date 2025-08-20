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
    estatus: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado' | 'Pagado' | 'Cancelado' | 'Programado' | 'PorFondear' | 'Generado';
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
    active: boolean;
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
    // Nuevo campo para montos específicos por factura (pagos parciales)
    montosEspecificos?: { [invoiceId: string]: number };
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
    // Nuevo campo para montos específicos por factura (pagos parciales)
    montosEspecificos?: { [invoiceId: string]: number };
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
    // Nuevo flag para indicar si las facturas enviadas son nuevas
    esNuevasFacturas?: boolean;
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

// Servicio para cambiar estado activo de un paquete
export const toggleInvoicesPackageActive = async (id: string, active: boolean): Promise<any> => {
    const response = await apiCall<any>(`/invoices-package/${id}/toggle-active`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
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
    const response = await apiCall<any>(`/invoices-package/by-usuario?usuario_id=${usuario_id}`, {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });
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
    routeId?: {
        _id: string;
        name: string;
        companyId: string;
        brandId: string;
        branchId: string;
        categoryId: string;
        status: boolean;
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

// Servicio para solicitar fondeo
export const requestFunding = async (companyId: string, bankAccountId: string, packageIds?: string[]): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        const response = await apiCall<any>(`/invoices-package/request-funding`, {
            method: "POST",
            body: JSON.stringify({ companyId, bankAccountId, packageIds }),
        });
        return {
            success: response.success,
            message: response.message,
            data: response.data
        };
    } catch (error: any) {
        console.error('Error al solicitar fondeo:', error);
        throw new Error(error?.message || 'Error al solicitar el fondeo');
    }
};

// Servicio para obtener paquetes por fondear (para preview)
export const getPackagesToFund = async (companyId: string, bankAccountId: string): Promise<{ packages: any[], total: number }> => {
    try {
        const response = await apiCall<any>(`/invoices-package/packages-to-fund?companyId=${companyId}&bankAccountId=${bankAccountId}`);
        return response.data || { packages: [], total: 0 };
    } catch (error: any) {
        console.error('Error al obtener paquetes por fondear:', error);
        return { packages: [], total: 0 };
    }
};

// Servicio para generar reporte (cambiar estatus a PorFondear)
export const generatePackageReport = async (packageId: string): Promise<{ success: boolean; message: string; data?: InvoicesPackage }> => {
    try {
        const response = await apiCall<InvoicesPackage>(`/invoices-package/${packageId}/generate-report`, {
            method: "POST",
        });
        return {
            success: response.success,
            message: response.message,
            data: response.data
        };
    } catch (error: any) {
        console.error('Error al generar reporte del paquete:', error);
        throw new Error(error?.message || 'Error al generar el reporte del paquete');
    }
};

// Servicio para actualizar múltiples paquetes a estatus "Generado"
export const updatePackagesToGenerated = async (packageIds: string[]): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        const response = await apiCall<any>('/invoices-package/update-to-generated', {
            method: "POST",
            body: JSON.stringify({ packageIds }),
        });
        return {
            success: response.success,
            message: response.message,
            data: response.data
        };
    } catch (error: any) {
        console.error('Error al actualizar paquetes a estatus "Generado":', error);
        throw new Error(error?.message || 'Error al actualizar el estatus de los paquetes');
    }
};

// Interfaz para la información del usuario
export interface UserInfo {
    _id: string;
    username: string;
    email: string;
    phone: string;
    profile: {
        name: string;
        lastName: string;
        fullName: string;
        path?: string;
        estatus: boolean;
        image?: {
            data: string;
            contentType: string;
        };
    };
    departmentId: string;
    department?: string;
    role?: {
        _id: string;
        name: string;
        description?: string;
    };
    createdAt: string;
    updatedAt?: string;
}

// Servicio para obtener información de un usuario por ID
export const getUserById = async (userId: string): Promise<UserInfo | null> => {
    try {
        const response = await apiCall<UserInfo>(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        return null;
    }
};

export interface Provider {
    _id: string;
    commercialName: string;
    businessName: string;
    rfc: string;
    contactName: string;
    bank: {
        _id: string;
        name: string;
    };
    accountNumber: string;
    clabe: string;
    referencia: string;
    sucursal: {
        _id: string;
        name: string;
    };
}

export const getProvidersByRfcs = async (rfcs: string[]): Promise<Provider[]> => {
    try {
        console.log('getProvidersByRfcs llamado con RFCs:', rfcs);
        const rfcsString = rfcs.join(',');
        console.log('RFCs string para URL:', rfcsString);
        
        const response = await apiCall<Provider[]>(`/providers/by-rfcs?rfcs=${rfcsString}`);
        console.log('Respuesta del backend:', response);
        
        const providers = response.data || [];
        console.log('Proveedores retornados:', providers.length);
        console.log('Datos de proveedores:', providers);
        
        return providers;
    } catch (error) {
        console.error('Error al obtener proveedores por RFCs:', error);
        return [];
    }
};

export interface ReportRow {
    cuentaCargo: string;
    cuentaAbono: string;
    bancoReceptor: string;
    beneficiario: string;
    sucursal: string;
    importe: number;
    plazaBanxico: string;
    concepto: string;
    estadoCuentaFiscal: string;
    rfc: string;
    iva: number;
    referenciaOrdenante: string;
    formaAplicacion: string;
    fechaAplicacion: string;
    emailBeneficiario: string;
}

export const generateExcelReport = async (data: ReportRow[], fileName: string = 'reporte_pagos.xlsx') => {
    const ExcelJS = await import('exceljs');

    // Crear el workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Pagos');

    // Configurar anchos de columna - Auto-ajuste al contenido
    worksheet.columns = [
        { header: '', key: 'col1', width: 18 }, // CUENTA DE CARGO
        { header: '', key: 'col2', width: 18 }, // CUENTA DE ABONO
        { header: '', key: 'col3', width: 25 }, // BANCO RECEPTOR
        { header: '', key: 'col4', width: 35 }, // BENEFICIARIO
        { header: '', key: 'col5', width: 25 }, // SUCURSAL
        { header: '', key: 'col6', width: 15 }, // IMPORTE
        { header: '', key: 'col7', width: 20 }, // PLAZA BANXICO
        { header: '', key: 'col8', width: 30 }, // CONCEPTO
        { header: '', key: 'col9', width: 25 }, // ESTADO DE CUENTA FISCAL
        { header: '', key: 'col10', width: 18 }, // RFC
        { header: '', key: 'col11', width: 12 }, // IVA
        { header: '', key: 'col12', width: 25 }, // REFERENCIA ORDENANTE
        { header: '', key: 'col13', width: 25 }, // FORMA DE APLICACIÓN
        { header: '', key: 'col14', width: 18 }, // FECHA DE APLICACIÓN
        { header: '', key: 'col15', width: 30 }  // EMAIL BENEFICIARIO
    ];

    // Fila 1: OBLIGATORIO - Solo en columna A con borde
    const row1 = worksheet.addRow(['OBLIGATORIO', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    row1.eachCell((cell: any, colNumber: any) => {
        if (colNumber === 1) { // Solo columna A
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' } // Rojo
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FFFFFFFF' }, // Blanco
                bold: true
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        }
    });

    // Fila 2: OPCIONAL - Solo en columna A con borde
    const row2 = worksheet.addRow(['OPCIONAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    row2.eachCell((cell: any, colNumber: any) => {
        if (colNumber === 1) { // Solo columna A
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFFFF' } // Blanco
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF000000' }, // Negro
                bold: true
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        }
    });

    // Fila 3: Tipo de transferencia - Solo en celda D3 con fondo gris
    const row3 = worksheet.addRow(['', '', '', 'Interbancaria con comprobante fiscal (con email)', '', '', '', '', '', '', '', '', '', '', '']);
    row3.eachCell((cell: any, colNumber: any) => {
        if (colNumber === 4) { // Solo columna D
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' } // Gris claro
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF000000' } // Negro
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        }
    });

    // Fila 4: Banco (Santander) - En columna D con fondo rojo en C4:E4
    const row4 = worksheet.addRow(['', '', '', 'Santander', '', '', '', '', '', '', '', '', '', '', '']);
    row4.eachCell((cell: any, colNumber: any) => {
        if (colNumber >= 3 && colNumber <= 5) { // Columnas C, D, E
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' } // Rojo
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };

            if (colNumber === 4) { // Solo la columna D tiene el texto
                cell.font = {
                    name: 'Arial',
                    size: 12,
                    color: { argb: 'FFFFFFFF' }, // Blanco
                    bold: true
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            }
        }
    });

    // Fila 5: Enlaces - En columnas C y E con fondo rojo
    const row5 = worksheet.addRow(['', '', 'Anexo-Catalogo de Bancos', '', 'CATÁLOGO DE CÓDIGOS DE PLAZAS', '', '', '', '', '', '', '', '', '', '']);
    row5.eachCell((cell: any, colNumber: any) => {
        if (colNumber >= 3 && colNumber <= 5) { // Columnas C, D, E
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' } // Rojo
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };

            if (colNumber === 3 || colNumber === 5) { // Columnas C y E tienen los enlaces
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    color: { argb: 'FF0000FF' }, // Azul
                    underline: true
                };
            }
        }
    });

    // Fila 6: Vacía - Sin bordes
    worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    // Fila 7: Encabezados de la tabla
    const headers = ['CUENTA DE CARGO', 'CUENTA DE ABONO', 'BANCO RECEPTOR', 'BENEFICIARIO', 'SUCURSAL', 'IMPORTE', 'PLAZA BANXICO', 'CONCEPTO', 'ESTADO DE CUENTA FISCAL', 'RFC', 'IVA', 'REFERENCIA ORDENANTE', 'FORMA DE APLICACIÓN', 'FECHA DE APLICACIÓN', 'EMAIL BENEFICIARIO'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell: any) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF0000' } // Rojo
        };
        cell.font = {
            name: 'Arial',
            size: 10,
            color: { argb: 'FFFFFFFF' }, // Blanco
            bold: true
        };
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        cell.border = {
            top: { style: 'thick', color: { argb: 'FF000000' } },
            bottom: { style: 'thick', color: { argb: 'FF000000' } },
            left: { style: 'thick', color: { argb: 'FF000000' } },
            right: { style: 'thick', color: { argb: 'FF000000' } }
        };
    });

    // Agregar datos
    data.forEach(row => {
        const dataRow = worksheet.addRow([
            row.cuentaCargo,
            row.cuentaAbono,
            row.bancoReceptor,
            row.beneficiario,
            row.sucursal,
            row.importe,
            row.plazaBanxico,
            row.concepto,
            row.estadoCuentaFiscal,
            row.rfc,
            row.iva,
            row.referenciaOrdenante,
            row.formaAplicacion,
            row.fechaAplicacion,
            row.emailBeneficiario
        ]);

        dataRow.eachCell((cell: any, colNumber: any) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFFFF' } // Blanco
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF000000' } // Negro
            };
            cell.border = {
                top: { style: 'thick', color: { argb: 'FF000000' } },
                bottom: { style: 'thick', color: { argb: 'FF000000' } },
                left: { style: 'thick', color: { argb: 'FF000000' } },
                right: { style: 'thick', color: { argb: 'FF000000' } }
            };

            // Formato de moneda para IMPORTE (columna 6) e IVA (columna 11)
            if (colNumber === 6 || colNumber === 11) {
                cell.numFmt = '$#,##0.00';
            }
        });
    });

    // Configurar altos de fila
    worksheet.getRow(1).height = 20; // OBLIGATORIO
    worksheet.getRow(2).height = 20; // OPCIONAL
    worksheet.getRow(3).height = 20; // Tipo de transferencia
    worksheet.getRow(4).height = 25; // Banco
    worksheet.getRow(5).height = 20; // Enlaces
    worksheet.getRow(6).height = 10; // Vacía
    worksheet.getRow(7).height = 25; // Encabezados

    // Auto-ajustar columnas al contenido
    worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50); // Mínimo 12, máximo 50
    });

    // Generar y descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
};

// Servicio para eliminar una factura específica del arreglo embebido en el paquete
export const removeInvoiceFromPackage = async (packageId: string, invoiceId: string): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        const response = await apiCall<any>(`/invoices-package/${packageId}/invoices/${invoiceId}`, {
            method: "DELETE",
        });
        return {
            success: response.success,
            message: response.message,
            data: response.data
        };
    } catch (error: any) {
        console.error('Error al eliminar factura del paquete:', error);
        throw new Error(error?.message || 'Error al eliminar la factura del paquete');
    }
};

// Servicio para eliminar un pago en efectivo específico del arreglo embebido en el paquete
export const removeCashPaymentFromPackage = async (packageId: string, cashPaymentId: string): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
        const response = await apiCall<any>(`/invoices-package/${packageId}/cash-payments/${cashPaymentId}`, {
            method: "DELETE",
        });
        return {
            success: response.success,
            message: response.message,
            data: response.data
        };
    } catch (error: any) {
        console.error('Error al eliminar pago en efectivo del paquete:', error);
        throw new Error(error?.message || 'Error al eliminar el pago en efectivo del paquete');
    }
}; 