// stores/users/useUsersCreateStore.ts
import { create } from 'zustand';
import { apiCall, useUsersBaseStore, type User } from './useUsersBaseStotore';

interface CreateUserData {
    username: string;
    password: string;
    department?: string;
    profile: {
        nombre: string;
        nombreCompleto: string;
        estatus?: boolean;
    };
    role?: string;
}

interface CreateStore {
    isCreating: boolean;
    createError: string | null;

    createUser: (userData: CreateUserData) => Promise<User>;
    clearError: () => void;
}

export const useUsersCreateStore = create<CreateStore>((set) => ({
    isCreating: false,
    createError: null,

    clearError: () => set({ createError: null }),

    createUser: async (userData: CreateUserData): Promise<User> => {
        const baseStore = useUsersBaseStore.getState();

        try {
            set({ isCreating: true, createError: null });

            const response = await apiCall<{ user: User }>('/users/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });

            if (response.data?.user) {
                baseStore.addUser(response.data.user);
            }

            return response.data!.user;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error creando usuario';
            set({ createError: errorMessage });
            throw error;
        } finally {
            set({ isCreating: false });
        }
    },
}));

export type { CreateUserData };