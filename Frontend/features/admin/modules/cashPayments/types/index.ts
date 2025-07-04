export interface CashPayment {
    _id: string;
    importeAPagar: number;
    importePagado: number;
    expenseConcept: {
        _id: string;
        name: string;
        categoryId?: any;
        description?: string;
    };
    description?: string;
    createdAt: string;
    
    // Estados de autorización y pago
    autorizada?: boolean | null;
    pagoRechazado?: boolean;
    estadoPago?: number | null;
    esCompleta?: boolean;
    registrado?: number;
    pagado?: number;
    descripcionPago?: string;
    fechaRevision?: string | null;
}

export interface CashPaymentFormData {
    importeAPagar: number;
    expenseConcept: string;
    description?: string;
}

export interface CashPaymentResponse {
    success: boolean;
    data: CashPayment;
    message?: string;
}

export interface CashPaymentListResponse {
    success: boolean;
    data: CashPayment[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
} 