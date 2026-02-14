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
      
      // Obtener la primera ruta disponible basándose en los permisos del usuario
      const firstRoute = getFirstAvailableRoute(allowedModules, isSuperAdmin);
      
      // Redirigir a la primera ruta disponible
      router.push(firstRoute);
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
