import { PageModules } from "@/types/auth";

/**
 * Verifica si el usuario tiene un módulo/permiso específico en una página
 */
export const hasPagePermission = (
  allowedModules: PageModules[],
  pagePath: string,
  modulePermission: string
): boolean => {
  // Buscar la página que coincida con el path
  const page = allowedModules.find(pageData => 
    pageData.path === pagePath || 
    pageData.path === `/${pagePath.replace(/^\//, '')}`
  );

  if (!page) {
    return false;
  }

  // Verificar si el usuario tiene el módulo/permiso específico
  return page.modules.some(module => 
    module.name.toLowerCase() === modulePermission.toLowerCase()
  );
};

/**
 * Verifica si el usuario puede acceder a una página (debe tener al menos un módulo básico)
 */
export const canAccessPage = (
  allowedModules: PageModules[],
  pagePath: string
): boolean => {
  // Normalizar el path (asegurar que empiece con /)
  const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;

  const page = allowedModules.find(pageData => {
    const normalizedPagePath = pageData.path.startsWith('/') ? pageData.path : `/${pageData.path}`;

    // Comparar solo el último segmento de ambas rutas
    const pageSegments = normalizedPagePath.split('/').filter(s => s.length > 0);
    const searchSegments = normalizedPath.split('/').filter(s => s.length > 0);

    const pageLastSegment = pageSegments.length > 0 ? pageSegments[pageSegments.length - 1] : normalizedPagePath;
    const searchLastSegment = searchSegments.length > 0 ? searchSegments[searchSegments.length - 1] : normalizedPath;

    return pageLastSegment === searchLastSegment;
  });

  if (!page) {
    return false;
  }

  // Si la página existe en allowedModules y tiene al menos un módulo, permitir acceso
  return page.modules && page.modules.length > 0;
};

/**
 * Obtiene todos los módulos/permisos que tiene el usuario en una página específica
 */
export const getPagePermissions = (
  allowedModules: PageModules[],
  pagePath: string
): string[] => {
  const page = allowedModules.find(pageData => 
    pageData.path === pagePath || 
    pageData.path === `/${pagePath.replace(/^\//, '')}`
  );

  if (!page) {
    return [];
  }

  return page.modules.map(module => module.name);
};

/**
 * Verifica si el usuario es Super Admin (tiene acceso total al sistema)
 */
export const isSuperAdmin = (userRole: string | null): boolean => {
  const role = userRole?.toLowerCase();
  return role === 'super admin' || role === 'superadmin';
};

/**
 * Verifica si el usuario es administrador (sin acceso total, debe validar permisos)
 * @deprecated Use isSuperAdmin for full access checks
 */
export const isAdministrator = (userRole: string | null): boolean => {
  return userRole?.toLowerCase() === 'administrador';
};

/**
 * Ya no usamos mapeo de rutas - las rutas en BD deben coincidir exactamente con las URLs
 * Este mapeo se mantiene comentado como referencia de las rutas que existían:
 * 
 * RUTAS ACTUALES DEL SISTEMA (usar estas exactas en la BD):
 * - /modulos/paquetes-facturas
 * - /modulos/paquetes-facturas/listado-paquetes 
 * - /modulos/paquetes-facturas/folios-autorizacion
 * - /catalogos/razones-sociales
 * - /catalogos/brand
 * - /catalogos/unidades-de-negocio
 * - /catalogos/sucursales
 * - /catalogos/rutas
 * - /catalogos/departamentos
 * - /catalogos/providers
 * - /catalogos/paises
 * - /catalogos/estados
 * - /catalogos/municipios
 * - /catalogos/bancos
 * - /catalogos/categorias-de-gastos
 * - /catalogos/conceptos-de-gastos
 * - /presupuestos/asignar-presupuesto
 * - /presupuestos/presupuestos-por-conceptos
 * - /modulos/conciliacion
 * - /modulos/importar-metadatos
 * - /herramientas/importar-movimientos-bancarios
 */
export const ROUTE_PATH_MAP: Record<string, string> = {};

/**
 * Obtiene el path de página para verificación de permisos basado en la ruta actual
 * Extrae solo la parte final de la ruta (después del último '/')
 */
export const getPagePathFromRoute = (route: string): string => {
  // Si la ruta tiene múltiples segmentos, tomar solo el último
  const segments = route.split('/').filter(segment => segment.length > 0);
  if (segments.length > 0) {
    return '/' + segments[segments.length - 1];
  }
  return route;
};