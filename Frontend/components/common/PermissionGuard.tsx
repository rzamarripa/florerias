"use client";

import { usePagePermissions } from "@/hooks/usePagePermissions";
import { ReactNode } from "react";

interface PermissionGuardProps {
  permission?: string;
  requireAdmin?: boolean;
  requireView?: boolean;
  requireCreate?: boolean;
  requireEdit?: boolean;
  requireDelete?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Componente para renderizar condicionalmente contenido basado en permisos
 */
export const PermissionGuard = ({
  permission,
  requireAdmin,
  requireView,
  requireCreate,
  requireEdit,
  requireDelete,
  fallback = null,
  children,
}: PermissionGuardProps) => {
  const { hasPermission, isAdmin, canView, canCreate, canEdit, canDelete } = usePagePermissions();

  // Si se requiere ser admin y no lo es, no mostrar contenido
  if (requireAdmin && !isAdmin()) {
    return <>{fallback}</>;
  }

  // Verificar permisos específicos de acciones básicas
  if (requireView && !canView()) {
    return <>{fallback}</>;
  }

  if (requireCreate && !canCreate()) {
    return <>{fallback}</>;
  }

  if (requireEdit && !canEdit()) {
    return <>{fallback}</>;
  }

  if (requireDelete && !canDelete()) {
    return <>{fallback}</>;
  }

  // Si se especifica un permiso personalizado y no lo tiene, no mostrar contenido
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>;
};