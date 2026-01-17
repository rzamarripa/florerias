"use client";

import { ChildrenType } from "@/types";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "usehooks-ts";

type Theme = "light" | "dark" | "system";

type SideNavSize = "default" | "compact" | "condensed" | "on-hover" | "on-hover-active" | "offcanvas";

interface SideNavType {
  size: SideNavSize;
  user: boolean;
  isMobileMenuOpen: boolean;
}

interface LayoutState {
  theme: Theme;
  sidenav: SideNavType;
}

interface LayoutContextType extends LayoutState {
  changeTheme: (theme: Theme) => void;
  changeSideNavSize: (size: SideNavSize, persist?: boolean) => void;
  toggleMobileMenu: () => void;
  showBackdrop: () => void;
  hideBackdrop: () => void;
}

const INIT_STATE: LayoutState = {
  theme: "light",
  sidenav: {
    size: "default",
    user: true,
    isMobileMenuOpen: false,
  },
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const useLayoutContext = () => {
  const context = use(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext can only be used within LayoutProvider");
  }
  return context;
};

const LayoutProvider = ({ children }: ChildrenType) => {
  const [settings, setSettings] = useLocalStorage<LayoutState>(
    "__LAYOUT_CONFIG__",
    INIT_STATE
  );

  const updateSettings = useCallback(
    (newSettings: Partial<LayoutState>) => {
      setSettings((prev) => ({
        ...prev,
        ...newSettings,
        sidenav: {
          ...prev.sidenav,
          ...(newSettings.sidenav || {}),
        },
      }));
    },
    [setSettings]
  );

  const changeTheme = useCallback(
    (nTheme: Theme) => {
      updateSettings({ theme: nTheme });
    },
    [updateSettings]
  );

  const changeSideNavSize = useCallback(
    (nSize: SideNavSize, persist = true) => {
      document.documentElement.setAttribute("data-sidenav-size", nSize);
      if (persist) {
        updateSettings({ sidenav: { ...settings.sidenav, size: nSize } });
      }
    },
    [settings.sidenav, updateSettings]
  );

  const toggleMobileMenu = useCallback(() => {
    updateSettings({
      sidenav: {
        ...settings.sidenav,
        isMobileMenuOpen: !settings.sidenav.isMobileMenuOpen,
      },
    });
  }, [settings.sidenav, updateSettings]);

  const showBackdrop = useCallback(() => {
    const backdrop = document.createElement("div");
    backdrop.id = "custom-backdrop";
    backdrop.className = "fixed inset-0 bg-black/50 z-40";
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";
    backdrop.addEventListener("click", () => {
      const html = document.documentElement;
      html.classList.remove("sidebar-enable");
      hideBackdrop();
    });
  }, []);

  const hideBackdrop = useCallback(() => {
    const backdrop = document.getElementById("custom-backdrop");
    if (backdrop) {
      document.body.removeChild(backdrop);
      document.body.style.overflow = "";
    }
  }, []);

  // Apply theme on mount and changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  // Apply sidenav size on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-sidenav-size", settings.sidenav.size);
  }, [settings.sidenav.size]);

  // Handle responsive sidenav
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 767.98) {
        changeSideNavSize("offcanvas", false);
      } else if (width <= 1140 && settings.sidenav.size !== "offcanvas") {
        changeSideNavSize("condensed", false);
      } else if (width > 1140) {
        changeSideNavSize(settings.sidenav.size);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <LayoutContext.Provider
      value={useMemo(
        () => ({
          ...settings,
          changeTheme,
          changeSideNavSize,
          toggleMobileMenu,
          showBackdrop,
          hideBackdrop,
        }),
        [settings, changeTheme, changeSideNavSize, toggleMobileMenu, showBackdrop, hideBackdrop]
      )}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export { LayoutProvider, useLayoutContext };
