"use client";

import { useUserSessionStore } from "@/stores";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { getFirstAvailableRoute } from "@/utils/menuBuilder";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserSessionStore();
  const { getIsSuperAdmin, role } = useUserRoleStore();
  const { allowedModules } = useUserModulesStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const isSuperAdmin = getIsSuperAdmin();
      const roleLower = role?.toLowerCase();
      
      let redirectRoute: string;
      
      // Manejar redirección específica por roles
      if (isSuperAdmin || roleLower === "super admin" || roleLower === "superadmin") {
        redirectRoute = "/gestion/roles";
      } else if (roleLower === "distribuidor") {
        redirectRoute = "/gestion/empresas";
      } else if (roleLower === "gerente") {
        // Verificar si el gerente tiene acceso a /sucursal/ventas
        const hasVentasAccess = allowedModules.some(
          module => module.path === "/sucursal/ventas" && 
          module.modules.some(m => m.name.toLowerCase() === "ver")
        );
        redirectRoute = hasVentasAccess ? "/sucursal/ventas" : getFirstAvailableRoute(allowedModules, false, role);
      } else if (roleLower === "cajero" || roleLower === "redes") {
        // Verificar si tiene acceso a /sucursal/ventas
        const hasVentasAccess = allowedModules.some(
          module => module.path === "/sucursal/ventas" && 
          module.modules.some(m => m.name.toLowerCase() === "ver")
        );
        redirectRoute = hasVentasAccess ? "/sucursal/ventas" : getFirstAvailableRoute(allowedModules, false, role);
      } else {
        // Para otros roles, obtener la primera ruta disponible
        redirectRoute = getFirstAvailableRoute(allowedModules, false, role);
      }
      
      // Redirigir a la ruta determinada
      router.push(redirectRoute);
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
    getIsSuperAdmin,
    allowedModules,
    role
  ]);

  return children;
}
