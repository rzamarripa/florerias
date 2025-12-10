"use client";

import { useUserSessionStore } from "@/stores";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserSessionStore();
  const { getIsAdmin, getIsManager, getIsSocialMedia, getIsDistributor } =
    useUserRoleStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const isAdmin = getIsAdmin();
      const isManager = getIsManager();
      const isSocialMedia = getIsSocialMedia();
      const isDistributor = getIsDistributor();

      if (isAdmin || isManager) {
        router.push("/finanzas/dashboard-analitico");
      } else if (isDistributor) {
        router.push("/gestion/empresas/dashboard");
      } else if (isSocialMedia) {
        router.push("/sucursal/ventas");
      } else {
        router.push("/sucursal/ventas");
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
    getIsAdmin,
    getIsManager,
    getIsSocialMedia,
    getIsDistributor,
  ]);

  return children;
}
