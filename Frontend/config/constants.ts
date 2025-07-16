import { type MenuItemType } from "@/types/layout";
import {
  CircleDollarSign,
  Component,
  Inbox,
  LayoutDashboard,
  PackageOpen,
  ShieldUser,
} from "lucide-react";

export const menuItems: MenuItemType[] = [
  { key: "menu", label: "Menu", isTitle: true },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      {
        key: "dashboard-presupuestos",
        label: "Dashboard Presupuestos",
        url: "/dashboard/dashboard-presupuestos",
      },
      {
        key: "dashboard-gastos",
        label: "Dashboard Gastos",
        url: "/dashboard/gastos",
        parentKey: "dashboard",
      },
      {
        key: "dashboard-conciliacion",
        label: "Dashboard Conciliación",
        url: "/dashboard/conciliacion",
        parentKey: "dashboard",
      },
    ],
  },
  {
    key: "catalogos",
    label: "Catálogos",
    icon: Inbox,
    children: [
      {
        key: "razonesSociales",
        label: "Razones Sociales",
        url: "/catalogos/razones-sociales",
      },
      {
        key: "marcas",
        label: "Marcas",
        url: "/catalogos/brand",
      },
      {
        key: "unidades-de-negocio",
        label: "Unidades de Negocio",
        url: "/catalogos/unidades-de-negocio",
      },
      {
        key: "sucursales",
        label: "Sucursales",
        url: "/catalogos/sucursales",
      },
      {
        key: "rutas",
        label: "Rutas",
        url: "/catalogos/rutas",
      },

      {
        key: "departamentos",
        label: "Departamentos",
        url: "/catalogos/departamentos",
      },
      {
        key: "proveedores",
        label: "Proveedores",
        url: "/catalogos/providers",
      },
      {
        key: "paises",
        label: "Países",
        url: "/catalogos/paises",
      },
      {
        key: "estados",
        label: "Estados",
        url: "/catalogos/estados",
      },
      {
        key: "municipios",
        label: "Municipios",
        url: "/catalogos/municipios",
      },
      {
        key: "bancos",
        label: "Bancos",
        url: "/catalogos/bancos",
      },
      {
        key: "categorias-de-gastos",
        label: "Categorías de Gastos",
        url: "/catalogos/categorias-de-gastos",
      },
      {
        key: "conceptos-de-gastos",
        label: "Conceptos de Gastos",
        url: "/catalogos/conceptos-de-gastos",
      },
    ],
  },
  {
    key: "paquetes",
    label: "Paquetes",
    icon: PackageOpen,
    children: [
      {
        key: "solicitarPaquete",
        label: "Solicitar Paquete",
        url: "/modulos/paquetes-facturas",
      },
      {
        key: "misPaquetes",
        label: "Mis Paquetes",
        url: "/modulos/paquetes-facturas/listado-paquetes",
      },
      {
        key: "historialPaquetes",
        label: "Historial de Paquetes",
        url: "/paquetes/historialPaquetes",
      },
    ],
  },
  {
    key: "presupuestos",
    label: "Presupuestos",
    icon: CircleDollarSign,
    children: [
      {
        key: "asignarPresupuesto",
        label: "Asignar Presupuesto",
        url: "/presupuestos/asignar-presupuesto",
      },
      {
        key: "historialPresupuestos",
        label: "Historial de Presupuestos",
        url: "/presupuestos/historialPresupuestos",
      },
    ],
  },
  {
    key: "gestion",
    label: "Gestión",
    icon: ShieldUser,
    children: [
      { key: "roles", label: "Roles", url: "/gestion/roles" },
      { key: "pages", label: "Páginas", url: "/gestion/paginas" },
      { key: "users", label: "Usuarios", url: "/gestion/usuarios" },
      { key: "visibilidad", label: "Visibilidad", url: "/gestion/visibilidad" },
    ],
  },
  {
    key: "modulos",
    label: "Módulos",
    icon: Component,
    children: [
      {
        key: "importar-metadatos",
        label: "Importar Metadatos",
        url: "/modulos/importar-metadatos",
      },
      {
        key: "paquetes-facturas",
        label: "Paquetes de Facturas",
        url: "/modulos/paquetes-facturas",
      },
      {
        key: "importar-movimientos-bancario",
        label: "Importar Movimientos Bancarios",
        url: "/herramientas/importar-movimientos-bancarios",
      },
      {
        key: "pagos-efectivo",
        label: "Pagos en Efectivo",
        url: "/modulos/pagos-efectivo",
      },
    ],
  },
];
