"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronRight,
  ChevronUp,
  Search,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { TbBuildingStore } from "react-icons/tb";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { MenuItemType } from "@/types/menu";
import {
  originalMenuItems,
  roleBasedMenuItems,
  userDropdownItems,
} from "@/config/constants";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import {
  canAccessPage,
  isSuperAdmin,
  getPagePathFromRoute,
} from "@/utils/pagePermissions";

import logo from "@/assets/images/logo.png";
import logoSm from "@/assets/images/logo-sm.png";
import { Fragment, useState, useEffect } from "react";
import BranchSelectionModal from "@/components/branches/BranchSelectionModal";

// Search button component
function SearchButton() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleSearch = () => {
    // Dispatch Cmd+K event to open command palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleSearch}
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <button
      onClick={handleSearch}
      className="flex w-full items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Buscar...</span>
      <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

// Theme toggle component
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-md border bg-muted/50 p-1">
      <Button
        variant={theme === "light" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 flex-1 gap-1.5"
        onClick={() => setTheme("light")}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="text-xs">Claro</span>
      </Button>
      <Button
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 flex-1 gap-1.5"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="text-xs">Oscuro</span>
      </Button>
    </div>
  );
}

// Recursive menu item component
function NavItem({ item }: { item: MenuItemType }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = item.url ? pathname.endsWith(item.url) : false;

  const isChildActive = (children: MenuItemType[]): boolean =>
    children.some(
      (child) =>
        (child.url && pathname.endsWith(child.url)) ||
        (child.children && isChildActive(child.children))
    );

  const hasActiveChild = item.children ? isChildActive(item.children) : false;

  if (item.children && item.children.length > 0) {
    return (
      <Collapsible
        asChild
        defaultOpen={hasActiveChild}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.label}
              isActive={hasActiveChild}
              disabled={item.isDisabled}
            >
              {item.icon && <item.icon />}
              <span>{item.label}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) =>
                child.children ? (
                  <NavItem key={child.key} item={child} />
                ) : (
                  <SidebarMenuSubItem key={child.key}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={child.url ? pathname.endsWith(child.url) : false}
                    >
                      <Link href={child.url || "#"}>
                        {child.icon && <child.icon />}
                        <span>{child.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              )}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.label}
        isActive={isActive}
        disabled={item.isDisabled}
      >
        <Link href={item.url || "#"}>
          {item.icon && <item.icon />}
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge.text}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// User profile in footer
function NavUser() {
  const { user } = useUserSessionStore();
  const { role } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const [showBranchModal, setShowBranchModal] = useState(false);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isAdministrator = role?.toLowerCase() === "administrador";

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {typeof user?.profile?.image === "string" ? (
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-primary/30">
                    <Image
                      src={user.profile.image}
                      alt={user?.username || "Usuario"}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.profile?.fullName || user?.username}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.role?.name || role || "Usuario"}
                  </span>
                </div>
                <ChevronUp className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="top"
              align="end"
              sideOffset={4}
            >
              {userDropdownItems.map((item, idx) => (
                <Fragment key={idx}>
                  {item.isHeader ? (
                    <div className="px-2 py-1.5 text-sm font-semibold">
                      {item.label}
                    </div>
                  ) : item.isDivider ? (
                    <DropdownMenuSeparator />
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href={item.url || "#"} className={item.class}>
                        {item.icon && <item.icon className="mr-2" size={17} />}
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </Fragment>
              ))}
              {isAdministrator && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowBranchModal(true)}
                    className="text-primary cursor-pointer"
                  >
                    <TbBuildingStore className="mr-2" size={17} />
                    <span>Seleccionar Sucursales</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {isAdministrator && activeBranch && !isCollapsed && (
        <div className="px-2 pb-2">
          <Badge
            variant="default"
            className="w-full justify-center bg-green-500 text-xs py-1"
          >
            <TbBuildingStore size={12} className="mr-1" />
            {activeBranch.branchName}
          </Badge>
        </div>
      )}

      <BranchSelectionModal
        show={showBranchModal}
        onHide={() => setShowBranchModal(false)}
      />
    </>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { allowedModules } = useUserModulesStore();
  const { role } = useUserRoleStore();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const filteredMenuItems = React.useMemo(() => {
    const isAdmin = isSuperAdmin(role);

    const filterMenuItem = (item: MenuItemType): MenuItemType | null => {
      if (item.isTitle) {
        return item;
      }

      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children
          .map((child) => filterMenuItem(child))
          .filter((child) => child !== null) as MenuItemType[];

        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren,
        };
      }

      if (isAdmin) {
        return item;
      }

      if (item.url) {
        const pagePath = getPagePathFromRoute(item.url);
        if (canAccessPage(allowedModules, pagePath)) {
          return item;
        }
        return null;
      }

      return item;
    };

    if (isAdmin) {
      return originalMenuItems
        .map((item) => filterMenuItem(item))
        .filter((item) => item !== null) as MenuItemType[];
    }

    const normalizedRole = role?.toLowerCase();
    let roleKey: string | null = null;

    if (normalizedRole === "gerente" || normalizedRole === "manager") {
      roleKey = "gerente";
    } else if (normalizedRole === "cajero" || normalizedRole === "cashier") {
      roleKey = "cajero";
    } else if (normalizedRole === "distribuidor" || normalizedRole === "distributor") {
      roleKey = "distribuidor";
    } else if (normalizedRole === "redes" || normalizedRole === "social media") {
      roleKey = "redes";
    } else if (normalizedRole === "admin" || normalizedRole === "administrador") {
      roleKey = "admin";
    }

    if (!roleKey) {
      return [];
    }

    const roleMenu = roleBasedMenuItems.find((item) => item.roleKey === roleKey);

    if (!roleMenu) {
      return [];
    }

    const roleParentMenu: MenuItemType = {
      key: roleMenu.key,
      label: roleMenu.label,
      icon: roleMenu.icon,
      children: originalMenuItems
        .map((item) => filterMenuItem(item))
        .filter((item) => item !== null && !item.isTitle) as MenuItemType[],
    };

    return [
      { key: "menu", label: "Módulos", isTitle: true },
      roleParentMenu,
    ].filter((item) => {
      if (item.children && item.children.length === 0) {
        return false;
      }
      return true;
    });
  }, [allowedModules, role]);

  // Group menu items by title sections
  const groupedItems = React.useMemo(() => {
    const groups: { title?: string; items: MenuItemType[] }[] = [];
    let currentGroup: { title?: string; items: MenuItemType[] } = { items: [] };

    filteredMenuItems.forEach((item) => {
      if (item.isTitle) {
        if (currentGroup.items.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = { title: item.label, items: [] };
      } else {
        currentGroup.items.push(item);
      }
    });

    if (currentGroup.items.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [filteredMenuItems]);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header with Logo */}
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={isCollapsed ? logoSm.src : logo.src}
            alt="Zolt"
            width={isCollapsed ? 32 : 120}
            height={isCollapsed ? 32 : 40}
            className={isCollapsed ? "h-8 w-8" : "h-8 w-auto"}
          />
        </Link>
      </SidebarHeader>

      {/* Search Bar */}
      <div className="px-2 pb-2">
        <SearchButton />
      </div>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        {groupedItems.map((group, idx) => (
          <SidebarGroup key={idx}>
            {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem key={item.key} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      {/* Theme Toggle */}
      <div className="px-2 py-2">
        <ThemeToggle />
      </div>

      {/* Footer with User */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
