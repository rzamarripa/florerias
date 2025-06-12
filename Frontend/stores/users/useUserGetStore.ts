// stores/users/useUsersGetStore.ts
import { create } from 'zustand';
import { apiCall, useUsersBaseStore, type User, type ApiResponse } from './useUsersBaseStotore';

interface GetStore {
    pagination: { page: number; limit: number; total: number; pages: number };
    filters: { search: string; status: string };

    getAllUsers: (page?: number, limit?: number) => Promise<void>;
    searchUsers: (search: string) => Promise<void>;
    filterByStatus: (status: string) => Promise<void>;
    setPagination: (pagination: any) => void;
    setFilters: (filters: Partial<{ search: string; status: string }>) => void;
}

export const useUsersGetStore = create<GetStore>((set, get) => ({
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    filters: { search: '', status: '' },

    setPagination: (pagination) => set({ pagination }),
    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
    })),

    getAllUsers: async (page = 1, limit = 10) => {
        const baseStore = useUsersBaseStore.getState();
        const { filters } = get();

        try {
            baseStore.setLoading(true);
            baseStore.setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(filters.search && { username: filters.search }),
                ...(filters.status && { estatus: filters.status }),
            });

            const response = await apiCall<User[]>(`/users?${params}`);

            baseStore.setUsers(response.data || []);
            if (response.pagination) {
                set({ pagination: response.pagination });
            }
        } catch (error) {
            baseStore.setError(error instanceof Error ? error.message : 'Error desconocido');
        } finally {
            baseStore.setLoading(false);
        }
    },

    searchUsers: async (search: string) => {
        set((state) => ({ filters: { ...state.filters, search } }));
        await get().getAllUsers(1, get().pagination.limit);
    },

    filterByStatus: async (status: string) => {
        set((state) => ({ filters: { ...state.filters, status } }));
        await get().getAllUsers(1, get().pagination.limit);
    },
}));