"use client";

import { toast } from "react-toastify";

// Mapeo de métodos HTTP a permisos
const HTTP_METHOD_TO_PERMISSION = {
  POST: "crear",
  PUT: "editar", 
  PATCH: "editar",
  DELETE: "eliminar"
} as const;

// URLs que deben ser excluidas de la validación de permisos
const EXCLUDED_URLS = [
  "/api/", // Todas las rutas de API - la validación se hace en el backend
  "/users/login",
  "/auth/",
  "/login",
  "/payments-by-provider/revert-layout",
  "/__nextjs_original-stack-frames", // Next.js internal debugging
  "/_next/", // Next.js assets
  "/__next", // Next.js internal routes
  "firebasestorage.googleapis.com", // Firebase Storage uploads
];

/**
 * Función para determinar si una URL debe ser validada
 */
function shouldValidateUrl(url: string): boolean {
  return !EXCLUDED_URLS.some(excludedUrl => url.includes(excludedUrl));
}

/**
 * Función para obtener el path de la página actual para verificación de permisos
 */
function getCurrentPagePath(): string {
  if (typeof window === 'undefined') return '';

  const pathname = window.location.pathname;

  // Extraer solo la parte final de la ruta (después del último '/')
  const segments = pathname.split('/').filter(segment => segment.length > 0);
  if (segments.length > 0) {
    return '/' + segments[segments.length - 1];
  }
  return pathname;
}

/**
 * Función para verificar si el usuario tiene permisos
 */
function hasPermission(requiredPermission: string): boolean {
  // Obtener datos del usuario desde los stores
  const userRoleStore = JSON.parse(localStorage.getItem('user-role') || '{}');
  const userModulesStore = JSON.parse(localStorage.getItem('user-modules') || '{}');

  const userRole = userRoleStore.state?.role;
  const allowedModules = userModulesStore.state?.allowedModules || [];

  // Solo Super Admin tiene acceso total
  if (userRole?.toLowerCase() === 'super admin' || userRole?.toLowerCase() === 'superadmin') {
    return true;
  }

  const currentPagePath = getCurrentPagePath();

  // Normalizar paths para comparación
  const normalizedCurrentPath = currentPagePath.startsWith('/') ? currentPagePath : `/${currentPagePath}`;

  // Buscar la página en los módulos permitidos (comparando solo el último segmento)
  const page = allowedModules.find((pageData: any) => {
    const normalizedPagePath = pageData.path.startsWith('/') ? pageData.path : `/${pageData.path}`;

    // Comparar solo el último segmento de ambas rutas
    const pageSegments = normalizedPagePath.split('/').filter((s: string) => s.length > 0);
    const currentSegments = normalizedCurrentPath.split('/').filter((s: string) => s.length > 0);

    const pageLastSegment = pageSegments.length > 0 ? pageSegments[pageSegments.length - 1] : normalizedPagePath;
    const currentLastSegment = currentSegments.length > 0 ? currentSegments[currentSegments.length - 1] : normalizedCurrentPath;

    return pageLastSegment === currentLastSegment;
  });

  if (!page) {
    return false;
  }

  // Verificar si tiene el permiso específico
  return page.modules.some((module: any) =>
    module.name.toLowerCase() === requiredPermission.toLowerCase()
  );
}

// Variable para evitar toasts duplicados
let lastPermissionError = '';
let lastPermissionErrorTime = 0;

/**
 * Función para mostrar toast de error sin duplicados
 */
function showPermissionError(message: string) {
  const now = Date.now();
  // Solo mostrar si es diferente mensaje o han pasado más de 2 segundos
  if (lastPermissionError !== message || now - lastPermissionErrorTime > 2000) {
    toast.error(message);
    lastPermissionError = message;
    lastPermissionErrorTime = now;
  }
}

/**
 * Interceptor global para fetch
 */
const originalFetch = window.fetch;

window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method?.toUpperCase() || 'GET';
  
  // Solo validar métodos que requieren permisos
  if (method in HTTP_METHOD_TO_PERMISSION && shouldValidateUrl(url)) {
    const requiredPermission = HTTP_METHOD_TO_PERMISSION[method as keyof typeof HTTP_METHOD_TO_PERMISSION];
    
    if (!hasPermission(requiredPermission)) {
      const errorMessage = `No tienes permisos para realizar la acción "${requiredPermission}" en esta página`;
      showPermissionError(errorMessage);
      
      // Retornar status 200 pero con success: false para manejo silencioso
      return Promise.resolve(new Response(
        JSON.stringify({ 
          success: false, 
          message: errorMessage,
          error: 'PERMISSION_DENIED',
          permissionDenied: true
        }), 
        { 
          status: 200, // OK pero con success: false
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }
  }
  
  // Si tiene permisos o no requiere validación, continuar con la petición original
  return originalFetch.call(this, input, init);
};

/**
 * Interceptor para XMLHttpRequest (si se usa)
 */
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
  this._method = method.toUpperCase();
  this._url = typeof url === 'string' ? url : url.toString();
  return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(data?: Document | XMLHttpRequestBodyInit | null) {
  const method = this._method;
  const url = this._url;
  
  // Solo validar métodos que requieren permisos
  if (method in HTTP_METHOD_TO_PERMISSION && shouldValidateUrl(url)) {
    const requiredPermission = HTTP_METHOD_TO_PERMISSION[method as keyof typeof HTTP_METHOD_TO_PERMISSION];
    
    if (!hasPermission(requiredPermission)) {
      const errorMessage = `No tienes permisos para realizar la acción "${requiredPermission}" en esta página`;
      // showPermissionError(errorMessage); // COMENTADO - no mostrar toast
      
      // Simular respuesta 200 con success: false para manejo silencioso
      setTimeout(() => {
        this.readyState = 4;
        this.status = 200; // OK pero con success: false
        this.statusText = 'OK';
        this.responseText = JSON.stringify({ 
          success: false, 
          message: errorMessage,
          error: 'PERMISSION_DENIED',
          permissionDenied: true
        });
        
        if (this.onreadystatechange) {
          this.onreadystatechange();
        }
        
        // No disparar evento de error, solo el load normal
        const loadEvent = new Event('load');
        this.dispatchEvent(loadEvent);
      }, 0);
      
      return;
    }
  }
  
  // Si tiene permisos, continuar con la petición original
  return originalXHRSend.apply(this, [data]);
};

// Extender los tipos de XMLHttpRequest para incluir nuestras propiedades
declare global {
  interface XMLHttpRequest {
    _method: string;
    _url: string;
  }
}

console.log('🔒 Global HTTP Permission Interceptor initialized');