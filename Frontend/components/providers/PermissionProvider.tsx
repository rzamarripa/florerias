"use client";

import { useEffect, ReactNode } from 'react';

interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * Provider que inicializa el interceptor global de permisos HTTP
 * Debe ser usado una sola vez en el root de la aplicación
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
  useEffect(() => {
    // Importar dinámicamente el interceptor solo en el cliente
    if (typeof window !== 'undefined') {
      import('@/lib/httpInterceptor').then(() => {
        console.log('✅ Permission interceptor loaded');
      }).catch((error) => {
        console.error('❌ Error loading permission interceptor:', error);
      });
    }
  }, []);

  return <>{children}</>;
}