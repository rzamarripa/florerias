export interface Country {
    _id: string;
    name: string;
}

export interface State {
    _id: string;
    name: string;
    countryId: Country;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface StatePagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface StateApiResponse {
    success: boolean;
    data: State[];
    pagination?: StatePagination;
    message?: string;
}

export interface StateActionsProps {
    state: State;
    onStateSaved?: () => void;
}