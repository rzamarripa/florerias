"use client";

import { useUserModulesStore } from "@/stores/userModulesStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import {
  hasPagePermission,
  canAccessPage,
  getPagePermissions,
  isSuperAdmin,
  getPagePathFromRoute
} from "@/utils/pagePermissions";
import { usePathname } from "next/navigation";

/**
 * Hook personalizado para manejar permisos de página
 */
export const usePagePermissions = (customPath?: string) => {
  const pathname = usePathname();
  const { allowedModules } = useUserModulesStore();
  const { role } = useUserRoleStore();

  // Usar path personalizado o el pathname actual
  const currentPath = customPath || pathname;
  const pagePath = getPagePathFromRoute(currentPath);

  /**
   * Verifica si el usuario tiene un permiso específico en la página actual
   */
  const hasPermission = (modulePermission: string): boolean => {
    // Solo Super Admin tiene todos los permisos
    if (isSuperAdmin(role)) {
      return true;
    }

    return hasPagePermission(allowedModules, pagePath, modulePermission);
  };

  /**
   * Verifica si el usuario puede acceder a la página actual
   */
  const canAccess = (): boolean => {
    // Solo Super Admin puede acceder a todas las páginas
    if (isSuperAdmin(role)) {
      return true;
    }

    return canAccessPage(allowedModules, pagePath);
  };

  /**
   * Obtiene todos los permisos del usuario en la página actual
   */
  const getAllPermissions = (): string[] => {
    // Solo Super Admin tiene todos los permisos
    if (isSuperAdmin(role)) {
      return ['superadmin'];
    }

    return getPagePermissions(allowedModules, pagePath);
  };

  /**
   * Verifica si el usuario es Super Admin (acceso total)
   */
  const isAdmin = (): boolean => {
    return isSuperAdmin(role);
  };

  /**
   * Funciones específicas para cada tipo de acción básica
   */
  const canView = (): boolean => {
    if (isSuperAdmin(role)) return true;
    return hasPagePermission(allowedModules, pagePath, 'ver');
  };

  const canCreate = (): boolean => {
    if (isSuperAdmin(role)) return true;
    return hasPagePermission(allowedModules, pagePath, 'crear');
  };

  const canEdit = (): boolean => {
    if (isSuperAdmin(role)) return true;
    return hasPagePermission(allowedModules, pagePath, 'editar');
  };

  const canDelete = (): boolean => {
    if (isSuperAdmin(role)) return true;
    return hasPagePermission(allowedModules, pagePath, 'eliminar');
  };

  return {
    hasPermission,
    canAccess,
    getAllPermissions,
    isAdmin,
    canView,
    canCreate,
    canEdit,
    canDelete,
    currentPath: pagePath,
    userRole: role,
    allowedModules
  };
};