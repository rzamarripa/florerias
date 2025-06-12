// stores/users/useUsersDeleteStore.ts
import { create } from 'zustand';
import { apiCall, useUsersBaseStore, type User } from './useUsersBaseStotore';

interface DeleteStore {
    isDeleting: boolean;
    deleteError: string | null;
    showConfirmation: boolean;
    userToDelete: User | null;

    deleteUser: (userId: string) => Promise<void>;
    showDeleteConfirmation: (user: User) => void;
    hideDeleteConfirmation: () => void;
    confirmDelete: () => Promise<void>;
    clearError: () => void;
}

export const useUsersDeleteStore = create<DeleteStore>((set, get) => ({
    isDeleting: false,
    deleteError: null,
    showConfirmation: false,
    userToDelete: null,

    clearError: () => set({ deleteError: null }),

    showDeleteConfirmation: (user: User) => set({
        showConfirmation: true,
        userToDelete: user,
        deleteError: null,
    }),

    hideDeleteConfirmation: () => set({
        showConfirmation: false,
        userToDelete: null,
        deleteError: null,
    }),

    deleteUser: async (userId: string): Promise<void> => {
        const baseStore = useUsersBaseStore.getState();

        try {
            set({ isDeleting: true, deleteError: null });

            const response = await apiCall<User>(`/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.data) {
                // El backend devuelve el usuario desactivado
                baseStore.updateUser(userId, response.data);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error eliminando usuario';
            set({ deleteError: errorMessage });
            throw error;
        } finally {
            set({ isDeleting: false });
        }
    },

    confirmDelete: async (): Promise<void> => {
        const { userToDelete } = get();
        if (userToDelete) {
            await get().deleteUser(userToDelete._id);
            set({ showConfirmation: false, userToDelete: null });
        }
    },
}));