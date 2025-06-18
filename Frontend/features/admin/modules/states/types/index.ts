export interface State {
    _id: string;
    name: string;
    country: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface StateActionsProps {
    state: State;
    onStateSaved?: () => void;
}