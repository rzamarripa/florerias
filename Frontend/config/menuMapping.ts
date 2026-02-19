import { 
  ShieldUser,
  Users,
  User,
  UserCheck,
  Truck,
  Building2,
  Wallet,
  Plus,
  ShoppingCart,
  Package,
  DollarSign,
  ClipboardList,
  Package2,
  Scale,
  CreditCard,
  Settings,
  FileText,
  UserCog,
  Building,
  Warehouse,
  History,
  Calendar,
  MapPinHouse,
  ChartPie,
  Stars,
  Store,
  LayoutDashboard,
  Factory,
  TrendingUp,
  Heart,
  ShoppingBag,
  Wrench,
  UserCircle,
  Receipt,
  Palette,
  Globe
} from "lucide-react";

export interface MenuMetadata {
  label: string;
  icon?: any;
  category?: string;
  subcategory?: string; // Para items dentro de una subcategoría
  order?: number;
  parent?: string; // Deprecated - usar subcategory
}

/**
 * Mapeo de rutas a su configuración de menú
 * Las rutas deben coincidir con las que vienen en allowedModules
 */
export const MENU_METADATA: Record<string, MenuMetadata> = {
  // Dashboard / Inicio
  "/gestion/dashboard-empresa": {
    label: "Dashboard Empresa",
    icon: LayoutDashboard,
    category: "Dashboard / Inicio",
    order: 1
  },
  "/gestion/empresas/dashboard": {
    label: "Dashboard Distribuidor",
    icon: LayoutDashboard,
    category: "Dashboard / Inicio",
    order: 2
  },
  "/finanzas/dashboard-analitico": {
    label: "Dashboard Analítico",
    icon: ChartPie,
    category: "Dashboard / Inicio",
    order: 3
  },

  // Operaciones (Sucursal)
  "/sucursal/nuevo-pedido": {
    label: "Nuevo Pedido",
    icon: Plus,
    category: "Operaciones",
    order: 1
  },
  "/sucursal/ventas": {
    label: "Ventas",
    icon: ShoppingCart,
    category: "Operaciones",
    order: 2
  },
  "/catalogos/gastos": {
    label: "Gastos",
    icon: Receipt,
    category: "Operaciones",
    order: 3
  },
  "/catalogos/compras": {
    label: "Compras", 
    icon: ShoppingCart,
    category: "Operaciones",
    order: 4
  },
  "/sucursal/almacenes": {
    label: "Almacenes",
    icon: Warehouse,
    category: "Operaciones",
    order: 5
  },
  "/sucursal/eventos": {
    label: "Eventos",
    icon: Calendar,
    category: "Operaciones",
    order: 6
  },

  // Operaciones > Cajas (subcategoría)
  "/ventas/cajas": {
    label: "Cajas Registradoras",
    icon: Wallet,
    category: "Operaciones",
    subcategory: "Cajas",
    order: 1
  },
  "/panel-de-control/cajas/historial": {
    label: "Historial de Cajas",
    icon: History,
    category: "Operaciones",
    subcategory: "Cajas",
    order: 2
  },
  "/ventas/cajas-redes-sociales": {
    label: "Cajas de Redes Sociales",
    icon: Wallet,
    category: "Operaciones",
    subcategory: "Cajas",
    order: 3
  },

  // Producción
  "/ventas/listado-produccion": {
    label: "Listado de Producción",
    icon: ClipboardList,
    category: "Producción",
    order: 1
  },
  "/produccion/pizarron-ventas": {
    label: "Pizarrón de Producción",
    icon: ClipboardList,
    category: "Producción",
    order: 2
  },
  "/produccion/pizarron-envio": {
    label: "Pizarrón de Envío",
    icon: ClipboardList,
    category: "Producción",
    order: 3
  },

  // Finanzas y Reportes
  "/finanzas/finanzas": {
    label: "Finanzas",
    icon: DollarSign,
    category: "Finanzas y Reportes",
    order: 1
  },
  "/ventas/ventas-empresas": {
    label: "Ventas de Franquicias",
    icon: Building,
    category: "Finanzas y Reportes",
    order: 2
  },

  // Clientes y Lealtad
  "/panel/clientes": {
    label: "Clientes",
    icon: User,
    category: "Clientes y Lealtad",
    order: 1
  },
  "/admin/digital-cards": {
    label: "Tarjetas Digitales",
    icon: CreditCard,
    category: "Clientes y Lealtad",
    order: 2
  },
  "/panel/config-puntos": {
    label: "Configuración de Puntos",
    icon: Stars,
    category: "Clientes y Lealtad",
    order: 3
  },

  // Personal
  "/panel/cajeros": {
    label: "Cajeros",
    icon: UserCheck,
    category: "Personal",
    order: 1
  },
  "/panel/repartidores": {
    label: "Repartidores",
    icon: Truck,
    category: "Personal",
    order: 2
  },
  "/panel/gerentes": {
    label: "Gerentes",
    icon: UserCog,
    category: "Personal",
    order: 3
  },
  "/panel/produccion-usuarios": {
    label: "Usuarios de Producción",
    icon: Package,
    category: "Personal",
    order: 4
  },
  "/panel/usuarios-redes": {
    label: "Usuarios de Redes",
    icon: Globe,
    category: "Personal",
    order: 5
  },
  "/gestion/proveedores": {
    label: "Proveedores",
    icon: Building,
    category: "Personal",
    order: 6
  },

  // Sucursales y Empresas
  "/panel-de-control/sucursales": {
    label: "Sucursales", 
    icon: Building2,
    category: "Sucursales y Empresas",
    order: 1
  },
  "/gestion/empresas": {
    label: "Empresas",
    icon: Building,
    category: "Sucursales y Empresas",
    order: 2
  },

  // Catálogos
  "/catalogos/etapas": {
    label: "Etapas de Ventas",
    icon: ChartPie,
    category: "Catálogos",
    order: 1
  },

  // Catálogos > Productos (subcategoría)
  "/catalogos/productos": {
    label: "Productos",
    icon: Package,
    category: "Catálogos",
    subcategory: "Productos",
    order: 1
  },
  "/catalogos/categorias-productos": {
    label: "Categorías de Productos",
    icon: Package,
    category: "Catálogos",
    subcategory: "Productos",
    order: 2
  },
  "/catalogos/listas-productos": {
    label: "Listas de Productos",
    icon: ClipboardList,
    category: "Catálogos",
    subcategory: "Productos",
    order: 3
  },
  "/catalogos/materiales": {
    label: "Materiales",
    icon: Package2,
    category: "Catálogos",
    subcategory: "Productos",
    order: 4
  },
  "/catalogos/gestion-materiales": {
    label: "Gestión de Materiales",
    icon: Package2,
    category: "Catálogos",
    subcategory: "Productos",
    order: 5
  },
  "/catalogos/unidades-medida": {
    label: "Unidades de Medida",
    icon: Scale,
    category: "Catálogos",
    subcategory: "Productos",
    order: 6
  },

  // Catálogos > Configuración (subcategoría)
  "/catalogos/payment-method": {
    label: "Métodos de Pago",
    icon: CreditCard,
    category: "Catálogos",
    subcategory: "Configuración",
    order: 1
  },
  "/catalogos/conceptos-gastos": {
    label: "Conceptos de Gastos",
    icon: Receipt,
    category: "Catálogos",
    subcategory: "Configuración",
    order: 2
  },
  "/catalogos/colonias": {
    label: "Colonias",
    icon: MapPinHouse,
    category: "Catálogos",
    subcategory: "Configuración",
    order: 3
  },
  "/catalogos/canales-venta": {
    label: "Canales de Venta",
    icon: Store,
    category: "Catálogos",
    subcategory: "Configuración",
    order: 4
  },

  // Gestión del Sistema
  "/gestion/roles": {
    label: "Roles",
    icon: ShieldUser,
    category: "Gestión del Sistema",
    order: 1
  },
  "/gestion/paginas": {
    label: "Páginas",
    icon: FileText,
    category: "Gestión del Sistema",
    order: 2
  },
  "/gestion/usuarios": {
    label: "Usuarios del Sistema",
    icon: Users,
    category: "Gestión del Sistema", 
    order: 3
  },

  // E-commerce (especial)
  "/ecommerce/dashboard": {
    label: "Dashboard E-commerce",
    icon: LayoutDashboard,
    category: "E-commerce",
    order: 1
  },
  "/ecommerce/configuracion": {
    label: "Configuración General",
    icon: Settings,
    category: "E-commerce",
    order: 2
  },
  "/ecommerce/configuracion/diseno": {
    label: "Diseño",
    icon: Palette,
    category: "E-commerce",
    order: 3
  },
  "/ecommerce/catalogo": {
    label: "Catálogo de productos",
    icon: Package,
    category: "E-commerce",
    order: 4
  }
};

/**
 * Orden de las categorías principales en el menú
 */
export const CATEGORY_ORDER = [
  "Dashboard / Inicio",
  "Operaciones",
  "Producción",
  "Finanzas y Reportes",
  "Clientes y Lealtad",
  "Personal",
  "Sucursales y Empresas",
  "Catálogos",
  "Gestión del Sistema",
  "E-commerce"
];

/**
 * Obtiene la metadata del menú para una ruta específica
 */
export const getMenuMetadata = (path: string): MenuMetadata | null => {
  // Normalizar la ruta
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return MENU_METADATA[normalizedPath] || null;
};