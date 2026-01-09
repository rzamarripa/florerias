"use client";

import MainLayout from "@/components/layout/MainLayout";
import { LayoutProvider } from "@/context/useLayoutContext";
import { useUserSessionStore } from "@/stores";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import BranchSelectionModal from "@/components/branches/BranchSelectionModal";
import BranchModal from "@/features/admin/modules/branches/components/BranchModal";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { toast } from "react-toastify";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [userCompany, setUserCompany] = useState<any>(null);
  
  // Verificar si estamos en la ruta de ecommerce
  const isEcommercePath = pathname?.startsWith('/ecommerce');

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

  // Cargar empresa del usuario si es Administrador
  useEffect(() => {
    const loadUserCompany = async () => {
      if (isInitialized && !isLoading && isAuthenticated) {
        const { role } = useUserRoleStore.getState();
        const isAdministrador = role?.toLowerCase() === "administrador";

        if (isAdministrador) {
          try {
            const company = await companiesService.getMyCompany();
            setUserCompany(company || null);
          } catch (error) {
            console.error("Error al cargar empresa del usuario:", error);
            setUserCompany(null);
          }
        }
      }
    };

    loadUserCompany();
  }, [isInitialized, isLoading, isAuthenticated]);

  // Mostrar modal de selección de sucursal si es Administrador y no tiene sucursal activa
  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      const { role } = useUserRoleStore.getState();
      const isAdministrador = role?.toLowerCase() === "administrador";

      // Verificar directamente desde el store persistente
      const currentActiveBranch = useActiveBranchStore.getState().activeBranch;

      // Si es administrador y no tiene sucursal activa, mostrar el modal
      if (isAdministrador && !currentActiveBranch) {
        setShowBranchModal(true);
      } else if (currentActiveBranch) {
        // Si hay sucursal activa, asegurarse de cerrar ambos modales
        setShowBranchModal(false);
        setShowCreateBranchModal(false);
      }
    }
  }, [isInitialized, isLoading, isAuthenticated, activeBranch]);

  // Callback cuando no se encuentran sucursales
  const handleNoBranchesFound = useCallback(() => {
    toast.warning(
      "Crea una sucursal para que puedas acceder a las funciones del sistema",
      {
        autoClose: 5000,
        position: "top-center",
      }
    );
    // Cerrar modal de selección y abrir modal de creación
    setShowBranchModal(false);
    setShowCreateBranchModal(true);
  }, []);

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
          onNoBranchesFound={handleNoBranchesFound}
        />

        {/* Modal de Creación de Sucursal */}
        <BranchModal
          show={showCreateBranchModal}
          onHide={() => {
            // Solo permitir cerrar si hay sucursal activa
            if (activeBranch) {
              setShowCreateBranchModal(false);
            }
          }}
          userCompany={userCompany}
          onBranchSaved={() => {
            // Cerrar el modal de creación
            setShowCreateBranchModal(false);
            // Reabrir el de selección solo si NO hay sucursal activa aún
            setTimeout(() => {
              const currentActiveBranch = useActiveBranchStore.getState().activeBranch;
              if (!currentActiveBranch) {
                setShowBranchModal(true);
              }
            }, 300);
          }}
        />
      </LayoutProvider>
    );
  }

  // Si estamos en la ruta de ecommerce, solo devolver children (el layout de ecommerce manejará su propia estructura)
  if (isEcommercePath) {
    return <>{children}</>;
  }

  // Para todas las demás rutas, usar el MainLayout normal
  return (
    <LayoutProvider>
      <MainLayout>{children}</MainLayout>
    </LayoutProvider>
  );
}
