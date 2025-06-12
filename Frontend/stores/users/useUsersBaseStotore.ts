// stores/users/useUsersBaseStore.ts
import { create } from 'zustand';

// ========== TIPOS BÁSICOS ==========
export interface User {
    _id: string;
    username: string;
    department?: string;
    profile: {
        nombre: string;
        nombreCompleto: string;
        path: string;
        estatus: boolean;
    };
    role?: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// ========== CONFIGURACIÓN ==========
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Función para obtener el token desde el store de sesión
const getTokenFromSessionStore = () => {
    if (typeof window === 'undefined') return null;

    try {
        // Obtener el estado persistido de Zustand
        const persistedState = localStorage.getItem('user-session');
        if (!persistedState) return null;

        const parsed = JSON.parse(persistedState);
        return parsed?.state?.token || null;
    } catch (error) {
        console.error('Error obteniendo token:', error);
        return null;
    }
};

export const getAuthHeaders = () => {
    const token = getTokenFromSessionStore();

    // Debug: verificar si el token existe
    console.log('Token encontrado:', token ? 'Sí' : 'No');
    if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
    }

    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

export const apiCall = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: getAuthHeaders(),
        ...options,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error en la operación');
    return data;
};

// ========== STORE BASE ==========
interface BaseStore {
    users: User[];
    loading: boolean;
    error: string | null;

    setUsers: (users: User[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    updateUser: (userId: string, userData: User) => void;
    addUser: (user: User) => void;
    removeUser: (userId: string) => void;
}

export const useUsersBaseStore = create<BaseStore>((set) => ({
    users: [],
    loading: false,
    error: null,

    setUsers: (users) => set({ users }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    updateUser: (userId, userData) => set((state) => ({
        users: state.users.map(user => user._id === userId ? userData : user)
    })),

    addUser: (user) => set((state) => ({
        users: [user, ...state.users]
    })),

    removeUser: (userId) => set((state) => ({
        users: state.users.filter(user => user._id !== userId)
    })),
}));