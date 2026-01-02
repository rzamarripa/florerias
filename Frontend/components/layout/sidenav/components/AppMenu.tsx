"use client";

import "./AppMenu.css";
import { useLayoutContext } from "@/context/useLayoutContext";
import { scrollToElement } from "@/helpers/layout";
import { MenuItemType } from "@/types/layout";
import { originalMenuItems } from "@/config/constants";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import {
  canAccessPage,
  isSuperAdmin,
  getPagePathFromRoute,
} from "@/utils/pagePermissions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Collapse } from "react-bootstrap";
import { TbChevronDown } from "react-icons/tb";
import {
  ShieldUser,
  UserCheck,
  UserCog,
  Truck,
  Wallet,
} from "lucide-react";

const MenuItemWithChildren = ({
  item,
  openMenuKey,
  setOpenMenuKey,
  level = 0,
}: {
  item: MenuItemType;
  openMenuKey: string | null;
  setOpenMenuKey: (key: string | null) => void;
  level?: number;
}) => {
  const pathname = usePathname();
  const isTopLevel = level === 0;

  const [localOpen, setLocalOpen] = useState(false);
  const [didAutoOpen, setDidAutoOpen] = useState(false);

  const isChildActive = (children: MenuItemType[]): boolean =>
    children.some(
      (child) =>
        (child.url && pathname.endsWith(child.url)) ||
        (child.children && isChildActive(child.children))
    );

  const isActive = isChildActive(item.children || []);

  const isOpen = isTopLevel ? openMenuKey === item.key : localOpen;

  useEffect(() => {
    if (isTopLevel && isActive && !didAutoOpen) {
      setOpenMenuKey(item.key);
      setDidAutoOpen(true);
    }
    if (!isTopLevel && isActive && !didAutoOpen) {
      setLocalOpen(true);
      setDidAutoOpen(true);
    }
  }, [isActive, isTopLevel, item.key, setOpenMenuKey, didAutoOpen]);

  const toggleOpen = () => {
    // Si el item está deshabilitado, no hacer nada
    if (item.isDisabled) return;
    
    if (isTopLevel) {
      setOpenMenuKey(isOpen ? null : item.key);
    } else {
      setLocalOpen((prev) => !prev);
    }
  };

  return (
    <li className={`side-nav-item ${isOpen ? "active" : ""} ${item.isDisabled ? "disabled" : ""}`}>
      <button
        onClick={toggleOpen}
        className={`side-nav-link ${item.isDisabled ? "disabled opacity-50" : ""}`}
        aria-expanded={isOpen}
        disabled={item.isDisabled}
      >
        {item.icon && (
          <span className="menu-icon">
            <item.icon />
          </span>
        )}
        <span className="menu-text">{item.label}</span>
        {item.badge ? (
          <span className={`badge bg-${item.badge.variant}`}>
            {item.badge.text}
          </span>
        ) : (
          <span className="menu-arrow">
            <TbChevronDown />
          </span>
        )}
      </button>
      <Collapse in={isOpen && !item.isDisabled}>
        <div>
          <ul className="sub-menu">
            {(item.children || []).map((child) =>
              child.children ? (
                <MenuItemWithChildren
                  key={child.key}
                  item={child}
                  openMenuKey={openMenuKey}
                  setOpenMenuKey={setOpenMenuKey}
                  level={level + 1}
                />
              ) : (
                <MenuItem key={child.key} item={child} />
              )
            )}
          </ul>
        </div>
      </Collapse>
    </li>
  );
};

const MenuItem = ({ item }: { item: MenuItemType }) => {
  const pathname = usePathname();
  const isActive = item.url && pathname.endsWith(item.url);

  const { sidenav, hideBackdrop } = useLayoutContext();

  const toggleBackdrop = () => {
    if (sidenav.size === "offcanvas") {
      hideBackdrop();
    }
  };

  return (
    <li className={`side-nav-item ${isActive ? "active" : ""}`}>
      <Link
        href={item.url ?? "/"}
        onClick={toggleBackdrop}
        className={`side-nav-link  ${isActive ? "active" : ""} ${
          item.isDisabled ? "disabled" : ""
        } ${item.isSpecial ? "special-menu" : ""}`}
      >
        {item.icon && (
          <span className="menu-icon">
            <item.icon />
          </span>
        )}
        <span className="menu-text">{item.label}</span>
        {item.badge && (
          <span className={`badge text-bg-${item.badge.variant} opacity-50`}>
            {item.badge.text}
          </span>
        )}
      </Link>
    </li>
  );
};

const AppMenu = () => {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const { allowedModules } = useUserModulesStore();
  const { role, getIsAdmin, getIsManager, getIsCashier, getIsSocialMedia, getIsDistributor } = useUserRoleStore();

  // Filtrar elementos del menú según permisos y roles
  const filteredMenuItems = useMemo(() => {
    const isAdmin = isSuperAdmin(role);

    // Si es Super Admin, usar el menú original con filtrado de permisos
    if (isAdmin) {
      const filterMenuItem = (item: MenuItemType): MenuItemType | null => {
        // Si es un título, siempre incluirlo
        if (item.isTitle) {
          return item;
        }

        // Si tiene children, filtrar recursivamente
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children
            .map((child) => filterMenuItem(child))
            .filter((child) => child !== null) as MenuItemType[];

          // Solo mostrar el menú dropdown si tiene al menos un hijo visible
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren,
          };
        }

        // Para Super Admin, todas las páginas están disponibles
        return item;
      };

      return originalMenuItems
        .map((item) => filterMenuItem(item))
        .filter((item) => item !== null) as MenuItemType[];
    }

    // Para otros roles, construir menús dinámicamente basados en permisos reales
    const buildRoleBasedMenus = (): MenuItemType[] => {
      const result: MenuItemType[] = [];
      
      // Agregar título
      result.push({ key: "menu", label: "Módulos", isTitle: true });

      // Obtener todas las páginas del menú original para mapear permisos
      const getAllMenuPages = (items: MenuItemType[]): MenuItemType[] => {
        const pages: MenuItemType[] = [];
        
        const traverse = (item: MenuItemType) => {
          if (item.url) {
            pages.push(item);
          }
          if (item.children) {
            item.children.forEach(traverse);
          }
        };
        
        items.forEach(traverse);
        return pages;
      };

      const allPages = getAllMenuPages(originalMenuItems);
      
      // Filtrar páginas que el usuario puede ver
      const accessiblePages = allPages.filter(page => {
        if (!page.url) return false;
        const pagePath = getPagePathFromRoute(page.url);
        return canAccessPage(allowedModules, pagePath);
      });

      // Determinar el rol actual del usuario
      let currentUserRole = '';
      if (getIsDistributor()) currentUserRole = 'distribuidor';
      else if (getIsAdmin()) currentUserRole = 'admin';
      else if (getIsManager()) currentUserRole = 'gerente';
      else if (getIsCashier()) currentUserRole = 'cajero';
      else if (getIsSocialMedia()) currentUserRole = 'redes';

      // Crear los módulos por rol - TODOS siempre visibles
      const roleModules = [
        {
          key: "modulos-distribuidor",
          label: "Módulos de Distribuidor",
          icon: Truck,
          roleKey: "distribuidor",
          children: currentUserRole === 'distribuidor' ? accessiblePages.map(page => ({
            ...page,
            isDisabled: false,
          })) : [],
          isDisabled: currentUserRole !== 'distribuidor',
        },
        {
          key: "modulos-administrador",
          label: "Módulos de Administrador",
          icon: ShieldUser,
          roleKey: "admin",
          children: currentUserRole === 'admin' ? accessiblePages.map(page => ({
            ...page,
            isDisabled: false,
          })) : [],
          isDisabled: currentUserRole !== 'admin',
        },
        {
          key: "modulos-gerente",
          label: "Módulos de Gerente",
          icon: UserCog,
          roleKey: "gerente",
          children: currentUserRole === 'gerente' ? accessiblePages.map(page => ({
            ...page,
            isDisabled: false,
          })) : [],
          isDisabled: currentUserRole !== 'gerente',
        },
        {
          key: "modulos-cajeros",
          label: "Módulos de Cajeros",
          icon: UserCheck,
          roleKey: "cajero",
          children: currentUserRole === 'cajero' ? accessiblePages.map(page => ({
            ...page,
            isDisabled: false,
          })) : [],
          isDisabled: currentUserRole !== 'cajero',
        },
        {
          key: "modulos-redes",
          label: "Módulos de Redes",
          icon: Wallet,
          roleKey: "redes",
          children: currentUserRole === 'redes' ? accessiblePages.map(page => ({
            ...page,
            isDisabled: false,
          })) : [],
          isDisabled: currentUserRole !== 'redes',
        },
      ];

      // Agregar todos los módulos al resultado
      result.push(...roleModules);

      return result;
    };

    // Construir menús basados en permisos reales para usuarios no Super Admin
    return buildRoleBasedMenus();
  }, [allowedModules, role, getIsAdmin, getIsManager, getIsCashier, getIsSocialMedia, getIsDistributor]);

  const scrollToActiveLink = () => {
    const activeItem: HTMLAnchorElement | null = document.querySelector(
      ".side-nav-link.active"
    );
    if (activeItem) {
      const simpleBarContent = document.querySelector(
        "#sidenav .simplebar-content-wrapper"
      );
      if (simpleBarContent) {
        const offset = activeItem.offsetTop - window.innerHeight * 0.4;
        scrollToElement(simpleBarContent, offset, 500);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => scrollToActiveLink(), 100);
  }, []);

  return (
    <ul className="side-nav">
      {filteredMenuItems.map((item) =>
        item.isTitle ? (
          <li className="side-nav-title" key={item.key}>
            {item.label}
          </li>
        ) : item.children ? (
          <MenuItemWithChildren
            key={item.key}
            item={item}
            openMenuKey={openMenuKey}
            setOpenMenuKey={setOpenMenuKey}
          />
        ) : (
          <MenuItem key={item.key} item={item} />
        )
      )}
    </ul>
  );
};

export default AppMenu;
