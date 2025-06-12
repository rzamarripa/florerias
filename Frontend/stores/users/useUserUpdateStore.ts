// stores/users/useUsersUpdateStore.ts
import { create } from 'zustand';
import { apiCall, useUsersBaseStore, type User } from './useUsersBaseStotore';

interface UpdateUserData {
    username?: string;
    department?: string;
    profile?: Partial<{
        nombre: string;
        nombreCompleto: string;
        estatus: boolean;
    }>;
    role?: string;
}

interface UpdateStore {
    isUpdating: boolean;
    updateError: string | null;

    updateUser: (userId: string, userData: UpdateUserData) => Promise<User>;
    activateUser: (userId: string) => Promise<User>;
    assignRole: (userId: string, roleId: string) => Promise<User>;
    changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<void>;
    clearError: () => void;
}

export const useUsersUpdateStore = create<UpdateStore>((set) => ({
    isUpdating: false,
    updateError: null,

    clearError: () => set({ updateError: null }),

    updateUser: async (userId: string, userData: UpdateUserData): Promise<User> => {
        const baseStore = useUsersBaseStore.getState();

        try {
            set({ isUpdating: true, updateError: null });

            const response = await apiCall<User>(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData),
            });

            if (response.data) {
                baseStore.updateUser(userId, response.data);
            }

            return response.data!;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error actualizando usuario';
            set({ updateError: errorMessage });
            throw error;
        } finally {
            set({ isUpdating: false });
        }
    },

    activateUser: async (userId: string): Promise<User> => {
        const baseStore = useUsersBaseStore.getState();

        try {
            set({ isUpdating: true, updateError: null });

            const response = await apiCall<User>(`/users/${userId}/activate`, {
                method: 'PUT',
            });

            if (response.data) {
                baseStore.updateUser(userId, response.data);
            }

            return response.data!;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error activando usuario';
            set({ updateError: errorMessage });
            throw error;
        } finally {
            set({ isUpdating: false });
        }
    },

    assignRole: async (userId: string, roleId: string): Promise<User> => {
        const baseStore = useUsersBaseStore.getState();

        try {
            set({ isUpdating: true, updateError: null });

            const response = await apiCall<User>(`/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: roleId }),
            });

            if (response.data) {
                baseStore.updateUser(userId, response.data);
            }

            return response.data!;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error asignando rol';
            set({ updateError: errorMessage });
            throw error;
        } finally {
            set({ isUpdating: false });
        }
    },

    changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
        try {
            set({ isUpdating: true, updateError: null });

            await apiCall(`/users/${userId}/password`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword }),
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error cambiando contraseña';
            set({ updateError: errorMessage });
            throw error;
        } finally {
            set({ isUpdating: false });
        }
    },
}));

export type { UpdateUserData };