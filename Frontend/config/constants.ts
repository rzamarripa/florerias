import { type MenuItemType } from "@/types/menu";
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
  QrCode,
  Store,
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

// DEPRECATED: Los menús ahora se construyen dinámicamente desde los permisos del usuario
// Ver: utils/menuBuilder.ts y config/menuMapping.ts

// DEPRECATED: Los menús ahora se construyen dinámicamente desde los permisos del usuario
// Ver: utils/menuBuilder.ts y config/menuMapping.ts

// DEPRECATED: Export mantenido solo para compatibilidad temporal
// Los menús ahora se construyen dinámicamente desde los permisos del usuario
export const menuItems: MenuItemType[] = [];

// DEPRECATED: Los menús ahora se construyen dinámicamente desde los permisos del usuario
// Ver: utils/menuBuilder.ts

// DEPRECATED: La normalización de roles ahora se maneja en el store de roles
// Ver: stores/userRoleStore.ts

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
  {
    key: "catalogo",
    label: "Catálogo de productos",
    url: "/ecommerce/catalogo",
    icon: Package,
  },
];
