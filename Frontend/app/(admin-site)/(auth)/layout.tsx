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
  const { getIsAdmin, getIsManager } = useUserRoleStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const isAdmin = getIsAdmin();
      const isManager = getIsManager();

      if (isAdmin || isManager) {
        router.push("/finanzas/dashboard-analitico");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, router, getIsAdmin, getIsManager]);

  return children;
}
