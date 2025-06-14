import { type MenuItemType } from "@/types/layout";
import { TbAlertHexagon, TbLayoutDashboard } from "react-icons/tb";

export const menuItems: MenuItemType[] = [
  { key: "menu", label: "Menu", isTitle: true },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: TbLayoutDashboard,
    url: "/dashboard",
  },
  {
    key: "catalogos",
    label: "Catálogos",
    icon: TbAlertHexagon,
    children: [
      {
        key: "razonesSociales",
        label: "Razones Sociales",
        url: "/catalogos/razonesSociales",
      },
      {
        key: "marcas",
        label: "Marcas",
        url: "/catalogos/marcas",
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
        url: "/catalogos/proveedores",
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
        key: "conceptosdegastos",
        label: "Conceptos de Gastos",
        url: "/catalogos/conceptosDeGastos",
      },
    ],
  },
  {
    key: "paquetes",
    label: "Paquetes",
    icon: TbAlertHexagon,
    children: [
      {
        key: "solicitarPaquete",
        label: "Solicitar Paquete",
        url: "/paquetes/solicitarPaquete",
      },
      {
        key: "misPaquetes",
        label: "Mis Paquetes",
        url: "/paquetes/misPaquetes",
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
    icon: TbAlertHexagon,
    children: [
      {
        key: "asignarPresupuesto",
        label: "Asignar Presupuesto",
        url: "/presupuestos/asignarPresupuesto",
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
    icon: TbAlertHexagon,
    children: [
      { key: "roles", label: "Roles", url: "/gestion/roles" },
      { key: "pages", label: "Páginas", url: "/gestion/paginas" },
      { key: "users", label: "Usuarios", url: "/gestion/usuarios" },
    ],
  },
];
