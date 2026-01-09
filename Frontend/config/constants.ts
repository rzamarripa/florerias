import { type MenuItemType } from "@/types/layout";
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
  Truck as DeliveryTruck,
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
  LogOut,
  LockKeyhole,
  HelpCircle,
  ChartPie,
  Box,
  Stars,
} from "lucide-react";

export interface UserDropdownItem {
  label: string;
  url?: string;
  icon?: any;
  isHeader?: boolean;
  isDivider?: boolean;
  class?: string;
}

export const userDropdownItems: UserDropdownItem[] = [
  { label: "Bienvenido!", isHeader: true },
  { label: "Mi cuenta", url: "/pages/profile", icon: User, class: "" },
  { label: "Configuración", url: "/pages/setting", icon: Settings, class: "" },
  { label: "Soporte", url: "/pages/support", icon: HelpCircle, class: "" },
  { isDivider: true, label: "" },
  {
    label: "Cambiar contraseña",
    url: "/pages/change-password",
    icon: LockKeyhole,
    class: "",
  },
  { isDivider: true, label: "" },
  {
    label: "Cerrar sesión",
    url: "/auth/logout",
    icon: LogOut,
    class: "text-danger",
  },
];

// Estructura de menús reorganizada por roles
export const roleBasedMenuItems: MenuItemType[] = [
  { key: "menu", label: "Módulos", isTitle: true },
  
  // Módulos de Distribuidor
  {
    key: "modulos-distribuidor",
    label: "Módulos de Distribuidor",
    icon: Truck,
    roleKey: "distribuidor",
    children: [
      {
        key: "reparto",
        label: "Reparto",
        url: "/sucursal/reparto",
        icon: DeliveryTruck,
      },
      {
        key: "repartidores",
        label: "Repartidores",
        url: "/panel/repartidores",
        icon: Truck,
      },
      {
        key: "pizarron-envio",
        label: "Pizarrón de Envio",
        url: "/produccion/pizarron-envio",
        icon: ClipboardList,
      },
      {
        key: "clientes",
        label: "Clientes",
        url: "/panel/clientes",
        icon: User,
      },
      {
        key: "colonias",
        label: "Colonias",
        url: "/catalogos/colonias",
        icon: MapPinHouse,
      },
    ],
  },

  // Módulos de Administrador
  {
    key: "modulos-administrador",
    label: "Módulos de Administrador",
    icon: ShieldUser,
    roleKey: "admin",
    children: [
      {
        key: "companies",
        label: "Empresas",
        url: "/gestion/empresas",
        icon: Building,
      },
      {
        key: "dashboard-company",
        label: "Dashboard Empresa",
        url: "/gestion/dashboard-empresa",
        icon: Building,
      },
      {
        key: "sucursales",
        label: "Sucursales",
        url: "/panel-de-control/sucursales",
        icon: Building2,
      },
      {
        key: "gestion",
        label: "Gestión",
        icon: Settings,
        children: [
          { key: "roles", label: "Roles", url: "/gestion/roles", icon: ShieldUser },
          {
            key: "pages",
            label: "Páginas",
            url: "/gestion/paginas",
            icon: FileText,
          },
          {
            key: "users",
            label: "Usuarios",
            url: "/gestion/usuarios",
            icon: Users,
          },
        ],
      },
      {
        key: "usuarios",
        label: "Usuarios",
        icon: Users,
        children: [
          {
            key: "clientes",
            label: "Clientes",
            url: "/panel/clientes",
            icon: User,
          },
          {
            key: "cajeros",
            label: "Cajeros",
            url: "/panel/cajeros",
            icon: UserCheck,
          },
          {
            key: "produccion-usuarios",
            label: "Producción",
            url: "/panel/produccion",
            icon: Package,
          },
          {
            key: "reparto-usuarios",
            label: "Reparto",
            url: "/panel/repartidores",
            icon: Truck,
          },
          {
            key: "gerentes",
            label: "Gerentes",
            url: "/panel/gerentes",
            icon: UserCog,
          },
        ],
      },
      {
        key: "reportes",
        label: "Reportes",
        icon: FileText,
        children: [
          {
            key: "finanzas",
            label: "Finanzas",
            url: "/finanzas/finanzas",
            icon: DollarSign,
          }
        ],
      },
      {
        key: "catalogos",
        label: "Catálogos",
        icon: Package2,
        children: [
          {
            key: "catalogo-etapas",
            label: "Etapas de Ventas",
            url: "/catalogos/etapas",
            icon: ChartPie,
          },
          {
            key: "proveedores",
            label: "Proveedores",
            url: "/gestion/proveedores",
            icon: Building,
          },
          {
            key: "productos",
            label: "Productos",
            url: "/catalogos/productos",
            icon: Package,
          },
          {
            key: "inventario",
            label: "Inventario",
            icon: Box,
            children: [
              {
                key: "categorias-productos",
                label: "Categorias de productos",
                url: "/catalogos/categorias-productos",
                icon: Package,
              },
              {
                key: "listas-productos",
                label: "Listas de Productos",
                url: "/catalogos/listas-productos",
                icon: ClipboardList,
              },
              {
                key: "materiales",
                label: "Materiales",
                url: "/catalogos/materiales",
                icon: Package2,
              },
              {
                key: "gestion-materiales",
                label: "Gestion de Materiales",
                url: "/catalogos/gestion-materiales",
                icon: Package2,
              },
            ],
          },
          {
            key: "unidades",
            label: "Unidades de Medida",
            url: "/catalogos/unidades-medida",
            icon: Scale,
          },
          {
            key: "metodos-pago",
            label: "Metodos de Pago",
            url: "/catalogos/payment-method",
            icon: CreditCard,
          },
          {
            key: "conceptos-gastos",
            label: "Conceptos de gastos",
            url: "/catalogos/conceptos-gastos",
            icon: ShoppingCart,
          },
          {
            key: "colonias",
            label: "Colonias",
            url: "/catalogos/colonias",
            icon: MapPinHouse,
          },
        ],
      },
    ],
  },

  // Módulos de Gerente
  {
    key: "modulos-gerente",
    label: "Módulos de Gerente",
    icon: UserCog,
    roleKey: "gerente",
    children: [
      {
        key: "ventas",
        label: "Ventas",
        url: "/sucursal/ventas",
        icon: ShoppingCart,
      },
      {
        key: "nuevo_pedido",
        label: "Nuevo Pedido",
        url: "/sucursal/nuevo-pedido",
        icon: Plus,
      },
      {
        key: "gastos",
        label: "Gastos",
        url: "/catalogos/gastos",
        icon: DollarSign,
      },
      {
        key: "compras",
        label: "Compras",
        url: "/catalogos/compras",
        icon: ShoppingCart,
      },
      {
        key: "almacenes",
        label: "Almacenes",
        url: "/sucursal/almacenes",
        icon: Warehouse,
      },
      {
        key: "eventos",
        label: "Eventos",
        url: "/sucursal/eventos",
        icon: Calendar,
      },
      {
        key: "produccion",
        label: "Producción",
        icon: Package,
        children: [
          {
            key: "pizarron-produccion",
            label: "Pizarrón de Produccion",
            url: "/produccion/pizarron-ventas",
            icon: ClipboardList,
          },
          {
            key: "pizarron-envio",
            label: "Pizarrón de Envio",
            url: "/produccion/pizarron-envio",
            icon: ClipboardList,
          },
        ],
      },
      {
        key: "cajas-control",
        label: "Cajas",
        icon: Wallet,
        children: [
          {
            key: "historial-cajas",
            label: "Historial",
            url: "/panel-de-control/cajas/historial",
            icon: History,
          },
          {
            key: "cajas",
            label: "Cajas Registradoras",
            url: "/ventas/cajas",
            icon: Wallet,
          },
        ],
      },
      {
        key: "usuarios-gerente",
        label: "Usuarios",
        icon: Users,
        children: [
          {
            key: "clientes",
            label: "Clientes",
            url: "/panel/clientes",
            icon: User,
          },
          {
            key: "cajeros",
            label: "Cajeros",
            url: "/panel/cajeros",
            icon: UserCheck,
          },
          {
            key: "produccion-usuarios",
            label: "Producción",
            url: "/panel/produccion",
            icon: Package,
          },
          {
            key: "reparto-usuarios",
            label: "Reparto",
            url: "/panel/repartidores",
            icon: Truck,
          },
        ],
      },
      {
        key: "reportes-gerente",
        label: "Reportes",
        icon: FileText,
        children: [
          {
            key: "finanzas",
            label: "Finanzas",
            url: "/finanzas/finanzas",
            icon: DollarSign,
          }
        ],
      },
    ],
  },

  // Módulos de Cajeros
  {
    key: "modulos-cajeros",
    label: "Módulos de Cajeros",
    icon: UserCheck,
    roleKey: "cajero",
    children: [
      {
        key: "nuevo_pedido",
        label: "Nuevo Pedido",
        url: "/sucursal/nuevo-pedido",
        icon: Plus,
      },
      {
        key: "ventas",
        label: "Ventas",
        url: "/sucursal/ventas",
        icon: ShoppingCart,
      },
      {
        key: "cajas",
        label: "Cajas Registradoras",
        url: "/ventas/cajas",
        icon: Wallet,
      },
      {
        key: "clientes",
        label: "Clientes",
        url: "/panel/clientes",
        icon: User,
      },
      {
        key: "productos",
        label: "Productos",
        url: "/catalogos/productos",
        icon: Package,
      },
      {
        key: "metodos-pago",
        label: "Metodos de Pago",
        url: "/catalogos/payment-method",
        icon: CreditCard,
      },
    ],
  },

  // Módulos de Redes
  {
    key: "modulos-redes",
    label: "Módulos de Redes",
    icon: Wallet,
    roleKey: "redes",
    children: [
      {
        key: "cajas-redes",
        label: "Cajas de Redes",
        url: "/ventas/cajas-redes-sociales",
        icon: Wallet,
      },
      {
        key: "nuevo_pedido",
        label: "Nuevo Pedido",
        url: "/sucursal/nuevo-pedido",
        icon: Plus,
      },
      {
        key: "ventas",
        label: "Ventas",
        url: "/sucursal/ventas",
        icon: ShoppingCart,
      },
      {
        key: "clientes",
        label: "Clientes",
        url: "/panel/clientes",
        icon: User,
      },
      {
        key: "eventos",
        label: "Eventos",
        url: "/sucursal/eventos",
        icon: Calendar,
      },
      {
        key: "productos",
        label: "Productos",
        url: "/catalogos/productos",
        icon: Package,
      },
    ],
  },
];

// Menú original para Super Admin
export const originalMenuItems: MenuItemType[] = [
  { key: "menu", label: "Menu", isTitle: true },
  {
    key: "companies",
    label: "Empresas",
    url: "/gestion/empresas",
    icon: Building,
  },
  {
    key: "dashboard-company",
    label: "Dashboard Empresa",
    url: "/gestion/dashboard-empresa",
    icon: Building,
  },
  {
    key: "sucursal",
    label: "Sucursal",
    icon: Building2,
    children: [
      {
        key: "sucursales",
        label: "Sucursales",
        url: "/panel-de-control/sucursales",
        icon: Building,
      },
      {
        key: "nuevo_pedido",
        label: "Nuevo Pedido",
        url: "/sucursal/nuevo-pedido",
        icon: Plus,
      },
      {
        key: "ventas",
        label: "Ventas",
        url: "/sucursal/ventas",
        icon: ShoppingCart,
      },
      {
        key: "reparto",
        label: "Reparto",
        url: "/sucursal/reparto",
        icon: DeliveryTruck,
      },
      {
        key: "gastos",
        label: "Gastos",
        url: "/catalogos/gastos",
        icon: DollarSign,
      },
      {
        key: "compras",
        label: "Compras",
        url: "/catalogos/compras",
        icon: ShoppingCart,
      },
      {
        key: "almacenes",
        label: "Almacenes",
        url: "/sucursal/almacenes",
        icon: Warehouse,
      },
      {
        key: "eventos",
        label: "Eventos",
        url: "/sucursal/eventos",
        icon: Calendar,
      },
      {
        key: "produccion",
        label: "Producción",
        icon: Package,
        children: [
          {
            key: "listado-produccion",
            label: "Listado de Producción",
            url: "/ventas/listado-produccion",
            icon: ClipboardList,
          },
          {
            key: "ventas-empresas",
            label: "Ventas de Franquicias",
            url: "/ventas/ventas-empresas",
            icon: Building,
          },
          {
            key: "pizarron-produccion",
            label: "Pizarrón de Produccion",
            url: "/produccion/pizarron-ventas",
            icon: ClipboardList,
          },
          {
            key: "pizarron-envio",
            label: "Pizarrón de Envio",
            url: "/produccion/pizarron-envio",
            icon: ClipboardList,
          },
        ],
      },
      {
        key: "cajas-control",
        label: "Cajas",
        icon: Wallet,
        children: [
          {
            key: "historial-cajas",
            label: "Historial",
            url: "/panel-de-control/cajas/historial",
            icon: History,
          },
          {
            key: "cajas",
            label: "Cajas Registradoras",
            url: "/ventas/cajas",
            icon: Wallet,
          },
          {
            key: "cajas-redes",
            label: "Cajas de Redes",
            url: "/ventas/cajas-redes-sociales",
            icon: Wallet,
          },
        ],
      },
      {
        key: "usuarios",
        label: "Usuarios",
        icon: Users,
        children: [
          {
            key: "clientes",
            label: "Clientes",
            url: "/panel/clientes",
            icon: User,
          },
          {
            key: "configuracion-puntos",
            label: "Configuracion de Puntos",
            url: "/panel/config-puntos",
            icon: Stars,
          },
          {
            key: "cajeros",
            label: "Cajeros",
            url: "/panel/cajeros",
            icon: UserCheck,
          },
          {
            key: "produccion",
            label: "Producción",
            url: "/panel/produccion",
            icon: Package,
          },
          {
            key: "reparto",
            label: "Reparto",
            url: "/panel/repartidores",
            icon: Truck,
          },
          {
            key: "gerentes",
            label: "Gerentes",
            url: "/panel/gerentes",
            icon: UserCog,
          },
        ],
      },
    ],
  },
  {
    key: "catalogos",
    label: "Catálogos",
    icon: Package2,
    children: [
      {
        key: "catalogo-etapas",
        label: "Etapas de Ventas",
        url: "/catalogos/etapas",
        icon: ChartPie,
      },
      {
        key: "proveedores",
        label: "Proveedores",
        url: "/gestion/proveedores",
        icon: Building,
      },
      {
        key: "productos",
        label: "Productos",
        url: "/catalogos/productos",
        icon: Package,
      },
      {
        key: "inventario",
        label: "Inventario",
        icon: Box,
        children: [
          {
            key: "categorias-productos",
            label: "Categorias de productos",
            url: "/catalogos/categorias-productos",
            icon: Package,
          },
          {
            key: "listas-productos",
            label: "Listas de Productos",
            url: "/catalogos/listas-productos",
            icon: ClipboardList,
          },
          {
            key: "materiales",
            label: "Materiales",
            url: "/catalogos/materiales",
            icon: Package2,
          },
          {
            key: "gestion-materiales",
            label: "Gestion de Materiales",
            url: "/catalogos/gestion-materiales",
            icon: Package2,
          },
        ],
      },
      {
        key: "unidades",
        label: "Unidades de Medida",
        url: "/catalogos/unidades-medida",
        icon: Scale,
      },
      {
        key: "metodos-pago",
        label: "Metodos de Pago",
        url: "/catalogos/payment-method",
        icon: CreditCard,
      },
      {
        key: "conceptos-gastos",
        label: "Conceptos de gastos",
        url: "/catalogos/conceptos-gastos",
        icon: ShoppingCart,
      },
      {
        key: "colonias",
        label: "Colonias",
        url: "/catalogos/colonias",
        icon: MapPinHouse,
      },
    ],
  },
  {
    key: "reportes",
    label: "Reportes",
    icon: FileText,
    children: [
      {
        key: "finanzas",
        label: "Finanzas",
        url: "/finanzas/finanzas",
        icon: DollarSign,
      }
    ],
  },
  {
    key: "gestion",
    label: "Gestión",
    icon: Settings,
    children: [
      { key: "roles", label: "Roles", url: "/gestion/roles", icon: ShieldUser },
      {
        key: "pages",
        label: "Páginas",
        url: "/gestion/paginas",
        icon: FileText,
      },
      {
        key: "users",
        label: "Usuarios",
        url: "/gestion/usuarios",
        icon: Users,
      },
    ],
  },
];

// Export por defecto para compatibilidad
export const menuItems: MenuItemType[] = originalMenuItems;

// Helper function para obtener el menú de un rol específico
export const getRoleMenuConfig = (roleKey: string) => {
  return roleBasedMenuItems.find(item => item.roleKey === roleKey);
};

// Helper function para normalizar nombre de rol a roleKey
export const normalizeRoleToKey = (role: string | null): string | null => {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase();
  
  if (normalizedRole === 'gerente' || normalizedRole === 'manager') {
    return 'gerente';
  } else if (normalizedRole === 'cajero' || normalizedRole === 'cashier') {
    return 'cajero';
  } else if (normalizedRole === 'distribuidor' || normalizedRole === 'distributor') {
    return 'distribuidor';
  } else if (normalizedRole === 'redes' || normalizedRole === 'social media') {
    return 'redes';
  } else if (normalizedRole === 'admin' || normalizedRole === 'administrador') {
    return 'admin';
  } else if (normalizedRole === 'super admin' || normalizedRole === 'superadmin') {
    return 'superadmin';
  }
  
  return null;
};

// Menú especial para configuración de e-commerce
export const ecommerceMenuItems: MenuItemType[] = [
  {
    key: "ecommerce-config",
    label: "Configuración E-commerce",
    isTitle: true,
  },
  {
    key: "diseno",
    label: "Diseño",
    url: "/ecommerce/configuracion/diseno",
    icon: ChartPie,
  },
];
