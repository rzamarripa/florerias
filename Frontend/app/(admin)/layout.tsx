"use client";

import { LayoutProvider } from "@/context/useLayoutContext";
import MainLayout from "@/layouts/MainLayout";
import { useUserSessionStore } from "@/stores";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserSessionStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push("/auth/sign-in");
    }
  }, [isInitialized, isAuthenticated, isLoading, router]);

  if (!isInitialized || isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <LayoutProvider>
      <MainLayout>{children}</MainLayout>
    </LayoutProvider>
  );
}
