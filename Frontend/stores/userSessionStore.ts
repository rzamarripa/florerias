import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/auth";

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
  updateUserProfile: (profileData: Partial<User["profile"]>) => void;
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

export const useUserSessionStore = create<UserSessionStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
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

      updateUserProfile: (profileData: Partial<User["profile"]>) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              profile: {
                ...user.profile,
                ...profileData,
              },
            },
          });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      clearUser: () => {
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
    }
  )
);
