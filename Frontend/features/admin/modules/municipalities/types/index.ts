export interface Country {
    _id: string;
    name: string;
}

export interface State {
    _id: string;
    name: string;
    countryId: Country;
}

export interface Municipality {
    _id: string;
    name: string;
    stateId: State;
    postalCodes?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface MunicipalityPagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface MunicipalityApiResponse {
    success: boolean;
    data: Municipality[];
    pagination?: MunicipalityPagination;
    message?: string;
}

export interface MunicipalitySearchParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string;
}