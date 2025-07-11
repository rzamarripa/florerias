import { apiCall } from "@/utils/api";
import { CashPayment, CashPaymentFormData, CashPaymentResponse } from "../types";

export const cashPaymentService = {
    getAll: async (params: { page?: number; limit?: number } = {}) => {
        const { page = 1, limit = 10 } = params;
        const searchParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        return await apiCall<CashPayment[]>(`/cash-payments?${searchParams}`);
    },
    getById: async (id: string) => {
        return await apiCall<CashPaymentResponse>(`/cash-payments/${id}`);
    },
    create: async (data: CashPaymentFormData) => {
        return await apiCall<CashPaymentResponse>("/cash-payments", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    update: async (id: string, data: CashPaymentFormData) => {
        return await apiCall<CashPaymentResponse>(`/cash-payments/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    delete: async (id: string) => {
        return await apiCall<CashPaymentResponse>(`/cash-payments/${id}`, {
            method: "DELETE",
        });
    },
};

export const {
    getAll: getCashPayments,
    getById: getCashPaymentById,
    create: createCashPayment,
    update: updateCashPayment,
    delete: deleteCashPayment,
} = cashPaymentService;

// Crear pago en efectivo y agregarlo a un paquete existente
export const createCashPaymentInPackage = async (data: CashPaymentFormData & { packageId: string }) => {
    // Llamar al nuevo endpoint que crea el pago y lo agrega al paquete existente
    return await apiCall("/cash-payments/add-to-package", {
        method: "POST",
        body: JSON.stringify({
            packageId: data.packageId,
            importeAPagar: data.importeAPagar,
            expenseConcept: data.expenseConcept,
            description: data.description
        })
    });
};

// Autorizar pago en efectivo embebido en paquete
export const authorizeCashPaymentInPackage = async (packageId: string, cashPaymentId: string) => {
    return await apiCall("/cash-payments/authorize-in-package", {
        method: "POST",
        body: JSON.stringify({ packageId, cashPaymentId }),
    });
};

// Rechazar pago en efectivo embebido en paquete
export const rejectCashPaymentInPackage = async (packageId: string, cashPaymentId: string) => {
    return await apiCall("/cash-payments/reject-in-package", {
        method: "POST",
        body: JSON.stringify({ packageId, cashPaymentId }),
    });
};

// Nota: Se usa getInvoicesPackagesCreatedByUsuario de invoicesPackpage.ts
// para obtener paquetes creados por el usuario específico

// Crear nuevo paquete con pago en efectivo
export const createPackageWithCashPayment = async (data: {
    cashPayment: CashPaymentFormData;
    packageData: {
        comentario: string;
        fechaPago: string;
        companyId?: string;
        brandId?: string;
        branchId?: string;
        usuario_id?: string;
        departamento_id?: string;
        departamento?: string;
    };
}) => {
    // Primero crear el pago en efectivo
    const cashPaymentResponse = await createCashPayment({
        importeAPagar: data.cashPayment.importeAPagar,
        expenseConcept: data.cashPayment.expenseConcept,
        description: data.cashPayment.description
    });

    // Luego crear el paquete con el pago en efectivo embebido
    const packageResponse = await apiCall("/invoices-package", {
        method: "POST",
        body: JSON.stringify({
            facturas: [], // Sin facturas
            pagosEfectivo: [cashPaymentResponse.data], // Incluir el pago en efectivo creado
            usuario_id: data.packageData.usuario_id,
            departamento_id: data.packageData.departamento_id,
            departamento: data.packageData.departamento,
            comentario: data.packageData.comentario,
            fechaPago: data.packageData.fechaPago,
            totalImporteAPagar: data.cashPayment.importeAPagar, // Incluir el total del pago en efectivo
            companyId: data.packageData.companyId,
            brandId: data.packageData.brandId,
            branchId: data.packageData.branchId
        }),
    });

    return packageResponse;
}; 