"use client";

import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface PageProtectionProps {
  requiredPermission?: "ver" | "crear" | "editar" | "eliminar";
  fallbackUrl?: string;
  children: ReactNode;
}

/**
 * Componente para proteger páginas completas basado en permisos
 * Se debe usar en cada página que requiera protección específica
 */
export const PageProtection = ({
  requiredPermission = "ver",
  fallbackUrl = "/dashboard",
  children,
}: PageProtectionProps) => {
  const { hasPermission, isAdmin, canAccess } = usePagePermissions();
  const router = useRouter();

  useEffect(() => {
    // Los administradores pueden acceder a todo
    if (isAdmin()) {
      return;
    }

    // Verificar si puede acceder a la página (tiene al menos un módulo básico)
    if (!canAccess()) {
      router.push(fallbackUrl);
      return;
    }

    // Verificar permiso específico requerido
    if (!hasPermission(requiredPermission)) {
      router.push(fallbackUrl);
      return;
    }
  }, [requiredPermission, fallbackUrl, router, hasPermission, isAdmin, canAccess]);

  // Verificaciones inmediatas para evitar flash de contenido
  if (!isAdmin()) {
    if (!canAccess() || !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta página.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};