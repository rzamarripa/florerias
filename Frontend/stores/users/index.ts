// stores/users/index.ts
// Store principal que combina todos los stores simplificados

import { useUsersBaseStore } from './useUsersBaseStotore';
import { useUsersGetStore } from './useUserGetStore';
import { CreateUserData, useUsersCreateStore } from './useUserCreateStore';
import { useUsersUpdateStore, type UpdateUserData } from './useUserUpdateStore';
import { useUsersDeleteStore } from './useUserDeleteStore';

export const useUsersStore = () => {
    const base = useUsersBaseStore();
    const get = useUsersGetStore();
    const create = useUsersCreateStore();
    const update = useUsersUpdateStore();
    const del = useUsersDeleteStore();

    return {
        // Estado base
        users: base.users,
        loading: base.loading,
        error: base.error,

        // Paginación y filtros
        pagination: get.pagination,
        filters: get.filters,

        // Estados específicos
        isCreating: create.isCreating,
        createError: create.createError,
        isUpdating: update.isUpdating,
        updateError: update.updateError,
        isDeleting: del.isDeleting,
        deleteError: del.deleteError,
        showConfirmation: del.showConfirmation,
        userToDelete: del.userToDelete,

        // Operaciones GET
        getAllUsers: get.getAllUsers,
        searchUsers: get.searchUsers,
        filterByStatus: get.filterByStatus,

        // Operaciones CREATE
        createUser: create.createUser,

        // Operaciones UPDATE
        updateUser: update.updateUser,
        activateUser: update.activateUser,
        assignRole: update.assignRole,
        changePassword: update.changePassword,

        // Operaciones DELETE
        deleteUser: del.deleteUser,
        showDeleteConfirmation: del.showDeleteConfirmation,
        hideDeleteConfirmation: del.hideDeleteConfirmation,
        confirmDelete: del.confirmDelete,

        // Limpiar errores
        clearErrors: () => {
            base.setError(null);
            create.clearError();
            update.clearError();
            del.clearError();
        },
    };
};

// Hook con operaciones combinadas útiles
export const useUsersOperations = () => {
    const store = useUsersStore();

    return {
        // Operación combinada: crear y recargar
        createAndReload: async (userData: CreateUserData) => {
            await store.createUser(userData);
            await store.getAllUsers(store.pagination.page, store.pagination.limit);
        },

        // Operación combinada: alternar estado
        toggleUserStatus: async (user: any) => {
            if (user.profile.estatus) {
                await store.deleteUser(user._id);
            } else {
                await store.activateUser(user._id);
            }
        },

        // Ir a página
        goToPage: async (page: number) => {
            await store.getAllUsers(page, store.pagination.limit);
        },
    };
};


// Re-exportar stores individuales si se necesitan
export {
    useUsersBaseStore,
    useUsersGetStore,
    useUsersCreateStore,
    useUsersUpdateStore,
    useUsersDeleteStore,
};