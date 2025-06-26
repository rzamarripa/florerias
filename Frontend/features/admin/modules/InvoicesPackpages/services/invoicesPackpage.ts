import { apiCall } from "@/utils/api";
import { ApiResponse } from '@/utils/api';

export interface InvoicesPackpage {
    _id: string;
    facturas: ImportedInvoice[];
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
}

export interface ImportedInvoice {
    _id: string;
    folioFiscalId: string;
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
    estadoPago: number;
    esCompleta: boolean;
    descripcionPago?: string;
    autorizada: boolean;
    fechaRevision?: string;
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

export interface InvoicesPackpageResponse {
    success: boolean;
    data: InvoicesPackpage;
    message?: string;
}

export interface InvoicesPackpagesResponse {
    success: boolean;
    data: InvoicesPackpage[];
    pagination: Pagination;
}

export interface InvoicesPackpageSummaryResponse {
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
    rfcProvider?: string;
    rfcCompany?: string;
    page?: number;
    limit?: number;
    estatus?: string;
    estadoPago?: string;
    sortBy?: string;
    order?: string;
}): Promise<ImportedInvoice[]> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const response = await apiCall<ImportedInvoice[]>(`/imported-invoices/by-provider-company?${queryParams}`);
    return response.data;
};

// Servicio para obtener resumen de facturas por proveedor y empresa
export const getInvoicesSummaryByProviderAndCompany = async (params: {
    rfcProvider?: string;
    rfcCompany?: string;
}): Promise<{
    totalFacturas: number;
    facturasCanceladas: number;
    facturasPendientes: number;
    facturasEnviadas: number;
    facturasPagadas: number;
    facturasRegistradas: number;
    totalImporteAPagar: number;
    totalPagado: number;
    totalSaldo: number;
}> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const response = await apiCall<any>(`/imported-invoices/summary-by-provider-company?${queryParams}`);
    return response.data;
};

// Servicio para crear un paquete de facturas
export const createInvoicesPackpage = async (data: {
    facturas: string[];
    usuario_id: string;
    departamento_id: string;
    departamento: string;
    comentario?: string;
    fechaPago: string;
    totalImporteAPagar?: number;
}): Promise<InvoicesPackpageResponse> => {
    const response = await apiCall<InvoicesPackpageResponse>("/invoices-packpage", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Servicio para obtener todos los paquetes
export const getInvoicesPackpages = async (params: {
    page?: number;
    limit?: number;
    estatus?: string;
    usuario_id?: string;
    departamento_id?: string;
    sortBy?: string;
    order?: string;
}): Promise<InvoicesPackpagesResponse> => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const response = await apiCall<InvoicesPackpagesResponse>(`/invoices-packpage?${queryParams}`);
    return response.data;
};

// Servicio para obtener un paquete específico
export const getInvoicesPackpageById = async (id: string): Promise<InvoicesPackpageResponse> => {
    const response = await apiCall<InvoicesPackpageResponse>(`/invoices-packpage/${id}`);
    return response.data;
};

// Servicio para actualizar un paquete
export const updateInvoicesPackpage = async (id: string, data: {
    facturas?: string[];
    estatus?: string;
    departamento_id?: string;
    departamento?: string;
    comentario?: string;
    fechaPago?: string;
    totalImporteAPagar?: number;
}): Promise<InvoicesPackpageResponse> => {
    const response = await apiCall<InvoicesPackpageResponse>(`/invoices-packpage/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
    return response.data;
};

// Servicio para eliminar un paquete
export const deleteInvoicesPackpage = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiCall<{ success: boolean; message: string }>(`/invoices-packpage/${id}`, {
        method: "DELETE",
    });
    return response.data;
};

// Servicio para obtener resumen de paquetes
export const getInvoicesPackpagesSummary = async (usuario_id?: string): Promise<InvoicesPackpageSummaryResponse> => {
    const queryParams = usuario_id ? `?usuario_id=${usuario_id}` : '';
    const response = await apiCall<InvoicesPackpageSummaryResponse>(`/invoices-packpage/summary${queryParams}`);
    return response.data;
};

// Servicio para cambiar estatus de un paquete
export const changeInvoicesPackpageStatus = async (id: string, estatus: string): Promise<InvoicesPackpageResponse> => {
    const response = await apiCall<InvoicesPackpageResponse>(`/invoices-packpage/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ estatus }),
    });
    return response.data;
};

// Servicio para obtener paquetes vencidos
export const getVencidosInvoicesPackpages = async (): Promise<InvoicesPackpagesResponse> => {
    const response = await apiCall<InvoicesPackpagesResponse>("/invoices-packpage/vencidos");
    return response.data;
};

// Servicio para marcar factura como pagada completamente
export async function markInvoiceAsFullyPaid(invoiceId: string, descripcion: string) {
    const response = await apiCall<any>(`/imported-invoices/${invoiceId}/mark-as-paid`, {
        method: "PUT",
        body: JSON.stringify({ descripcion }),
    });
    return response.data;
}

// Servicio para marcar factura como pagada parcialmente
export async function markInvoiceAsPartiallyPaid(invoiceId: string, descripcion: string, monto: number) {
    const response = await apiCall<any>(`/imported-invoices/${invoiceId}/partial-payment`, {
        method: "PUT",
        body: JSON.stringify({ descripcion, monto }),
    });
    return response.data;
}

// Servicio para obtener paquetes por usuario
export const getInvoicesPackpagesByUsuario = async (usuario_id: string): Promise<InvoicesPackpage[]> => {
    const timestamp = new Date().getTime();
    const response = await apiCall<{ success: boolean; data: InvoicesPackpage[] }>(
        `/invoices-packpage/by-usuario?usuario_id=${usuario_id}&_t=${timestamp}`
    );
    return response.data;
}; 