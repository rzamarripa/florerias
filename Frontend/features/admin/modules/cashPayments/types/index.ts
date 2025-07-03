export interface CashPayment {
    _id: string;
    amount: number;
    expenseConcept: {
        _id: string;
        name: string;
        categoryId?: any;
        description?: string;
    };
    description?: string;
    createdAt: string;
}

export interface CashPaymentFormData {
    amount: number;
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