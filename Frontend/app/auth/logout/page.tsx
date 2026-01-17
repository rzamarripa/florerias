"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSessionStore } from "@/stores";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useUserSessionStore();

  useEffect(() => {
    logout();
    router.replace("/iniciar-sesion");
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cerrando sesión...</p>
      </div>
    </div>
  );
}
