"use client";

import { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EcommerceSidebar } from "./components/EcommerceSidebar";
import { Separator } from "@/components/ui/separator";
import NotificationDropdown from "@/components/layout/topbar/components/NotificationDropdown";
import ThemeToggler from "@/components/layout/topbar/components/ThemeToggler";
import UserProfileDropdown from "@/components/layout/topbar/components/UserProfile";

interface EcommerceLayoutProps {
  children: ReactNode;
}

export default function EcommerceLayout({ children }: EcommerceLayoutProps) {
  return (
    <SidebarProvider>
      <EcommerceSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <ThemeToggler />
            <UserProfileDropdown />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
