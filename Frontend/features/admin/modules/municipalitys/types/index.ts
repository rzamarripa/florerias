export interface Municipality {
    _id: string;
    name: string;
    state: string;
    country: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface MunicipalitySearchParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string;
}