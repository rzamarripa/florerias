"use client";

import { useLayoutContext } from "@/context/useLayoutContext";
import { scrollToElement } from "@/helpers/layout";
import { MenuItemType } from "@/types/layout";
import { menuItems } from "@/config/constants";
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
    if (isTopLevel) {
      setOpenMenuKey(isOpen ? null : item.key);
    } else {
      setLocalOpen((prev) => !prev);
    }
  };

  return (
    <li className={`side-nav-item ${isOpen ? "active" : ""}`}>
      <button
        onClick={toggleOpen}
        className="side-nav-link"
        aria-expanded={isOpen}
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
      <Collapse in={isOpen}>
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
  const { role } = useUserRoleStore();

  // Filtrar elementos del menú según permisos
  const filteredMenuItems = useMemo(() => {
    const isAdmin = isSuperAdmin(role);

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
        // Si después del filtrado no quedan children, NO mostrar este menú
        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren,
        };
      }

      // Si es un item con URL (página individual), verificar permisos
      if (item.url) {
        // Super Admin puede ver todas las páginas
        if (isAdmin) {
          return item;
        }

        // Para otros usuarios, verificar permisos basados en módulos
        const pagePath = getPagePathFromRoute(item.url);
        return canAccessPage(allowedModules, pagePath) ? item : null;
      }

      // Si no tiene URL ni children, incluirlo (es un contenedor/separador)
      return item;
    };

    return menuItems
      .map((item) => filterMenuItem(item))
      .filter((item) => item !== null) as MenuItemType[];
  }, [allowedModules, role]);

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
