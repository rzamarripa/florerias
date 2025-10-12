import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserRoleState {
  role: string | null;
}

interface UserRoleActions {
  setUserRole: (roleName: string | null) => void;
  resetUserRole: () => void;
}

interface UserRoleGetters {
  hasRole: (roleName: string) => boolean;
  getIsAdmin: () => boolean;
  getIsSuperAdmin: () => boolean;
}

type UserRoleStore = UserRoleState & UserRoleActions & UserRoleGetters;

export const useUserRoleStore = create<UserRoleStore>()(
  persist(
    (set, get) => ({
      role: null,

      getIsAdmin: () => {
        const role = get().role?.toLowerCase();
        return role === "admin" || role === "administrador" || role === "super admin" || role === "superadmin";
      },

      getIsSuperAdmin: () => {
        const role = get().role?.toLowerCase();
        return role === "super admin" || role === "superadmin";
      },

      setUserRole: (roleName: string | null) => {
        set({ role: roleName });
      },

      resetUserRole: () => {
        set({ role: null });
      },

      hasRole: (roleName: string) => {
        const currentRole = get().role?.toLowerCase();
        return currentRole === roleName.toLowerCase();
      },
    }),
    {
      name: "user-role",
    }
  )
);
