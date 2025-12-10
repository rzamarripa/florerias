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
  getIsCashier: () => boolean;
  getIsManager: () => boolean;
  getIsSocialMedia: () => boolean;
  getIsDistributor: () => boolean;
}

type UserRoleStore = UserRoleState & UserRoleActions & UserRoleGetters;

export const useUserRoleStore = create<UserRoleStore>()(
  persist(
    (set, get) => ({
      role: null,

      getIsAdmin: () => {
        const role = get().role?.toLowerCase();
        return (
          role === "admin" ||
          role === "administrador" ||
          role === "super admin" ||
          role === "superadmin"
        );
      },

      getIsSuperAdmin: () => {
        const role = get().role?.toLowerCase();
        return role === "super admin" || role === "superadmin";
      },

      getIsCashier: () => {
        const role = get().role?.toLowerCase();
        return role === "cajero" || role === "cashier";
      },

      getIsManager: () => {
        const role = get().role?.toLowerCase();
        return role === "gerente" || role === "manager";
      },

      getIsSocialMedia: () => {
        const role = get().role?.toLowerCase();
        return role === "redes" || role === "social media";
      },

      getIsDistributor: () => {
        const role = get().role?.toLowerCase();
        return role === "distribuidor" || role === "distributor";
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
