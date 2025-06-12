import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModuleInfo, PageModules } from "../types/auth";

interface UserModulesState {
  allowedModules: PageModules[];
  isLoadingModules: boolean;
}

interface UserModulesActions {
  setAllowedModules: (allowedModulesArray: PageModules[]) => void;
  resetAllowedModules: () => void;
  setLoadingModules: (loading: boolean) => void;
  addModulesToPage: (pageName: string, modules: ModuleInfo[]) => void;
  removeModuleFromPage: (pageName: string, moduleId: string) => void;
}

interface UserModulesGetters {
  hasPageAccess: (pageName: string) => boolean;
  hasModuleAccess: (pageName: string, moduleName: string) => boolean;
  getPageModules: (pageName: string) => ModuleInfo[];
  getAllModuleNames: () => string[];
}

type UserModulesStore = UserModulesState &
  UserModulesActions &
  UserModulesGetters;

export const useUserModulesStore = create<UserModulesStore>()(
  persist(
    (set, get) => ({
      allowedModules: [],
      isLoadingModules: false,

      hasPageAccess: (pageName: string) => {
        return get().allowedModules.some(
          (pageData) => pageData.page.toLowerCase() === pageName.toLowerCase()
        );
      },

      hasModuleAccess: (pageName: string, moduleName: string) => {
        const pageData = get().allowedModules.find(
          (p) => p.page.toLowerCase() === pageName.toLowerCase()
        );
        return (
          pageData?.modules.some(
            (m) => m.name.toLowerCase() === moduleName.toLowerCase()
          ) || false
        );
      },

      getPageModules: (pageName: string) => {
        const pageData = get().allowedModules.find(
          (p) => p.page.toLowerCase() === pageName.toLowerCase()
        );
        return pageData?.modules || [];
      },

      getAllModuleNames: () => {
        return get().allowedModules.flatMap((page) =>
          page.modules.map((module) => module.name)
        );
      },

      setAllowedModules: (allowedModulesArray: PageModules[]) => {
        set({
          allowedModules: allowedModulesArray,
          isLoadingModules: false,
        });
      },

      resetAllowedModules: () => {
        set({
          allowedModules: [],
          isLoadingModules: false,
        });
      },

      setLoadingModules: (loading: boolean) => {
        set({ isLoadingModules: loading });
      },

      addModulesToPage: (pageName: string, modules: ModuleInfo[]) => {
        const { allowedModules } = get();
        const existingPageIndex = allowedModules.findIndex(
          (p) => p.page.toLowerCase() === pageName.toLowerCase()
        );

        if (existingPageIndex >= 0) {
          const updatedModules = [...allowedModules];
          updatedModules[existingPageIndex] = {
            ...updatedModules[existingPageIndex],
            modules: [...updatedModules[existingPageIndex].modules, ...modules],
          };
          set({ allowedModules: updatedModules });
        }
      },

      removeModuleFromPage: (pageName: string, moduleId: string) => {
        const { allowedModules } = get();
        const updatedModules = allowedModules.map((page) => {
          if (page.page.toLowerCase() === pageName.toLowerCase()) {
            return {
              ...page,
              modules: page.modules.filter((module) => module._id !== moduleId),
            };
          }
          return page;
        });
        set({ allowedModules: updatedModules });
      },
    }),
    {
      name: "user-modules",
    }
  )
);
