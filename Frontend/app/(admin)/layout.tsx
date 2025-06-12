"use client";

import { LayoutProvider } from "@/context/useLayoutContext";
import MainLayout from "@/layouts/MainLayout";
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider>
      <MainLayout>{children}</MainLayout>
    </LayoutProvider>
  );
}
