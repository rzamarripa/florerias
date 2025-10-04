import { type MenuItemType } from "@/types/layout";
import {
  ShieldUser,
} from "lucide-react";

export const menuItems: MenuItemType[] = [
  { key: "menu", label: "Menu", isTitle: true },
  {
    key: "gestion",
    label: "GESTION",
    icon: ShieldUser,
    children: [
      { key: "roles", label: "Roles", url: "/gestion/roles" },
      { key: "pages", label: "Páginas", url: "/gestion/paginas" },
      { key: "users", label: "Usuarios", url: "/gestion/usuarios" }
    ],
  },
  {
    key: "panel",
    label: "PANEL DE CONTROL",
    icon: ShieldUser,
    children: [
      {
        key: 'usuarios', 
        label: 'USUARIOS',
        children:[
          { key: "clientes", label: "Clientes", url: "/panel/clientes" },
          { key: "cajeros", label: "Cajeros", url: "/panel/cajeros" },
          { key: "produccion", label: "Produccion", url: "/panel/produccion" },
          { key: "reparto", label: "Reparto", url: "/panel/repartidores" },
          { key: "gerentes", label: "Gerentes", url: "/panel/gerentes" },
        ]
      },
      {
        key: 'sucursal', 
        label: 'SUCURSAL',
        children:[
          { key: "nuevo_pedido", label: "NUEVO PEDIDO", url: "/sucursal/nuevo-pedido" },
          { key: "ventas", label: "VENTAS", url: "/sucursal/ventas" },
          { key: "produccion", label: "Produccion", url: "/sucursal/produccion" },
          { key: "reparto", label: "Reparto", url: "/sucursal/reparto" },
          { key: "nuevo_gasto", label: "NUEVO GASTO", url: "/sucursal/nuevo-gasto" },
        ]
      },
    ],
  },
  {
    key: "catalogos",
    label: "CATÁLOGOS",
    icon: ShieldUser,
    children: [
      { key: "productos", label: "Productos", url: "/catalogos/productos" },
    ],
  },
];
