import type { User } from "@/features/admin/modules/users/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useActiveBranchStore } from "./activeBranchStore";

interface UserSessionState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UserSessionActions {
  setUser: (user: User | null, token: string | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

interface UserSessionGetters {
  getUserProfile: () => User["profile"] | null;
  getUserId: () => string | null;
  getUsername: () => string | null;
}

type UserSessionStore = UserSessionState &
  UserSessionActions &
  UserSessionGetters;

export type { UserSessionStore };

export const useUserSessionStore = create<UserSessionStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      getUserProfile: () => {
        return get().user?.profile || null;
      },

      getUserId: () => {
        return get().user?._id || null;
      },

      getUsername: () => {
        return get().user?.username || null;
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      setUser: (user: User | null, token: string | null) => {
        set({
          user,
          token,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      logout: () => {
        // Limpiar la sucursal activa al cerrar sesión
        useActiveBranchStore.getState().clearActiveBranch();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      clearUser: () => {
        // Limpiar la sucursal activa al limpiar usuario
        useActiveBranchStore.getState().clearActiveBranch();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "user-session",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);
