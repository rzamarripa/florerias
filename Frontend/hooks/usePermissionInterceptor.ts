"use client";

import { usePagePermissions } from "@/hooks/usePagePermissions";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";

/**
 * Hook que proporciona funciones interceptadas con validación de permisos automática
 */
export const usePermissionInterceptor = () => {
  const { canCreate, canEdit, canDelete, isAdmin } = usePagePermissions();
  const pathname = usePathname();

  /**
   * Intercepta peticiones POST (CREATE)
   */
  const interceptCreate = async (originalFunction: () => Promise<any> | any) => {
    // Solo Super Admin tiene acceso total sin validaciones
    if (isAdmin()) {
      return await originalFunction();
    }

    // Verificar si tiene permisos de crear
    if (!canCreate()) {
      toast.error("No tienes permisos para crear en esta página");
      throw new Error(`Permission denied: CREATE operation not allowed on ${pathname}`);
    }

    // Ejecutar la función original
    return await originalFunction();
  };

  /**
   * Intercepta peticiones PUT/PATCH (UPDATE)
   */
  const interceptEdit = async (originalFunction: () => Promise<any> | any) => {
    // Solo Super Admin tiene acceso total sin validaciones
    if (isAdmin()) {
      return await originalFunction();
    }

    if (!canEdit()) {
      toast.error("No tienes permisos para editar en esta página");
      throw new Error(`Permission denied: EDIT operation not allowed on ${pathname}`);
    }

    return await originalFunction();
  };

  /**
   * Intercepta peticiones DELETE
   */
  const interceptDelete = async (originalFunction: () => Promise<any> | any) => {
    // Solo Super Admin tiene acceso total sin validaciones
    if (isAdmin()) {
      return await originalFunction();
    }

    if (!canDelete()) {
      toast.error("No tienes permisos para eliminar en esta página");
      throw new Error(`Permission denied: DELETE operation not allowed on ${pathname}`);
    }

    return await originalFunction();
  };

  /**
   * Función genérica para validar permisos antes de cualquier acción
   */
  const validatePermission = (action: 'crear' | 'editar' | 'eliminar'): boolean => {
    // Solo Super Admin tiene acceso total
    if (isAdmin()) return true;

    switch (action) {
      case 'crear':
        return canCreate();
      case 'editar':
        return canEdit();
      case 'eliminar':
        return canDelete();
      default:
        return false;
    }
  };

  return {
    interceptCreate,
    interceptEdit,
    interceptDelete,
    validatePermission,
    // Funciones de verificación directa
    canCreate,
    canEdit,
    canDelete,
    isAdmin
  };
};