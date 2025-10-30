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
} from "lucide-react";

export const menuItems: MenuItemType[] = [
  { key: "menu", label: "Menu", isTitle: true },

  {
    key: "panel",
    label: "Panel de Control",
    icon: ShieldUser,
    children: [
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
            key: "cajas",
            label: "Cajas Registradoras",
            url: "/ventas/cajas",
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
            key: "reparto",
            label: "Reparto",
            url: "/sucursal/reparto",
            icon: DeliveryTruck,
          },
          {
            key: "nuevo_gasto",
            label: "Nuevo Gasto",
            url: "/sucursal/nuevo-gasto",
            icon: DollarSign,
          },
          {
            key: "almacenes",
            label: "Almacenes",
            url: "/sucursal/almacenes",
            icon: Warehouse,
          },
        ],
      },
      {
        key: "produccion",
        label: "Producción",
        icon: Package,
        children: [
          {
            key: "pizarron-ventas",
            label: "Pizarrón de Ventas",
            url: "/produccion/pizarron-ventas",
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
        key: "productos",
        label: "Productos",
        url: "/catalogos/productos",
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
      {
        key: "companies",
        label: "Empresas",
        url: "/gestion/empresas",
        icon: Building,
      },
    ],
  },
];
