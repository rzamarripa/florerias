"use client";

import MainLayout from "@/components/layout/MainLayout";
import { LayoutProvider } from "@/context/useLayoutContext";
import { useUserSessionStore } from "@/stores";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import BranchSelectionModal from "@/components/branches/BranchSelectionModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserSessionStore();
  const { getIsAdmin } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push("/iniciar-sesion");
    }
  }, [isInitialized, isAuthenticated, isLoading, router]);

  // Mostrar modal de selección de sucursal si es Administrador (no Super Admin) y no tiene sucursal activa
  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      const { role } = useUserRoleStore.getState();
      const isAdministrador = role?.toLowerCase() === "administrador";

      // Si es administrador (no Super Admin ni Admin) y no tiene sucursal activa, mostrar el modal
      if (isAdministrador && !activeBranch) {
        setShowBranchModal(true);
      }
    }
  }, [isInitialized, isLoading, isAuthenticated, activeBranch]);

  if (!isInitialized || isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Verificar si es Administrador (no Super Admin) sin sucursal activa
  const { role } = useUserRoleStore.getState();
  const isAdministrador = role?.toLowerCase() === "administrador";
  const needsBranchSelection = isAdministrador && !activeBranch;

  // Si es admin sin sucursal, mostrar solo el modal de selección
  if (needsBranchSelection) {
    return (
      <LayoutProvider>
        <MainLayout>
          {/* Pantalla de bloqueo mientras se selecciona sucursal */}
          <div className="container-fluid">
            <div className="row min-vh-100 align-items-center justify-content-center">
              <div className="col-md-6 text-center">
                <div className="mb-4">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
                <h4 className="mb-3">Selección de Sucursal Requerida</h4>
                <p className="text-muted">
                  Por favor, selecciona una sucursal para continuar.
                </p>
              </div>
            </div>
          </div>
        </MainLayout>

        {/* Modal obligatorio de selección de sucursal para Administradores */}
        <BranchSelectionModal
          show={showBranchModal}
          onHide={() => {
            // Solo permitir cerrar si hay sucursal activa
            if (activeBranch) {
              setShowBranchModal(false);
            }
          }}
          isRequired={true}
        />
      </LayoutProvider>
    );
  }

  return (
    <LayoutProvider>
      <MainLayout>{children}</MainLayout>
    </LayoutProvider>
  );
}
