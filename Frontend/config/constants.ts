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
      { key: "users", label: "Usuarios", url: "/gestion/usuarios" },
      { key: "companies", label: "Empresas", url: "/gestion/empresas" }
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
          { key: "sucursales", label: "Sucursales", url: "/panel-de-control/sucursales" },
          { key: "cajas", label: "Cajas Registradoras", url: "/ventas/cajas" },
          { key: "nuevo_pedido", label: "Nuevo Pedido", url: "/sucursal/nuevo-pedido" },
          { key: "ventas", label: "VENTAS", url: "/sucursal/ventas" },
          { key: "produccion", label: "Produccion", url: "/sucursal/produccion" },
          { key: "reparto", label: "Reparto", url: "/sucursal/reparto" },
          { key: "nuevo_gasto", label: "NUEVO GASTO", url: "/sucursal/nuevo-gasto" },
        ]
      },
      {
        key: 'produccion',
        label: 'PRODUCCION',
        children:[
          { key: "pizarron-ventas", label: "Pizarrón de Ventas", url: "/produccion/pizarron-ventas" },
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
      { key: "listas-productos", label: "Listas de Productos", url: "/catalogos/listas-productos" },
      { key: "materiales", label: "Materiales", url: "/catalogos/materiales" },
      { key: "unidades", label: "Unidades de Medida", url: "/catalogos/unidades-medida" },
      { key: "metodos-pago", label: "Metodos de Pago", url: "/catalogos/payment-method" },
    ],

  },
  {
    key: "ventas",
    label: "VENTAS",
    icon: ShieldUser,
    children: [
    ],

  },
];
