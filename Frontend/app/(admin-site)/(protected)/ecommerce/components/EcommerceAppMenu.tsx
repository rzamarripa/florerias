"use client";

import "@/components/layout/sidenav/components/AppMenu.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ecommerceMenuItems } from "@/config/constants";
import type { MenuItemType } from "@/types/layout";
import { useLayoutContext } from "@/context/useLayoutContext";

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
        className={`side-nav-link ${isActive ? "active" : ""}`}
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

const EcommerceAppMenu = () => {
  return (
    <ul className="side-nav">
      {ecommerceMenuItems.map((item) => (
        <Fragment key={item.key}>
          {item.isTitle ? (
            <li className="side-nav-title">{item.label}</li>
          ) : (
            <MenuItem item={item} />
          )}
        </Fragment>
      ))}
    </ul>
  );
};

export default EcommerceAppMenu;