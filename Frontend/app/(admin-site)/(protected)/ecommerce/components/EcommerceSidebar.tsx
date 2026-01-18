"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { ecommerceMenuItems, userDropdownItems } from "@/config/constants";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores";
import { useActiveBranchStore } from "@/stores/activeBranchStore";

import logoSm from "@/assets/images/logo-sm.png";
import { Fragment, useState } from "react";
import BranchSelectionModal from "@/components/branches/BranchSelectionModal";
import type { MenuItemType } from "@/types/menu";

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
                <Settings className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
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

export function EcommerceSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Group menu items by title sections
  const groupedItems = React.useMemo(() => {
    const groups: { title?: string; items: MenuItemType[] }[] = [];
    let currentGroup: { title?: string; items: MenuItemType[] } = { items: [] };

    ecommerceMenuItems.forEach((item) => {
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
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src={logoSm.src}
                    alt="Zolt"
                    width={32}
                    height={32}
                    className="size-8"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">E-Commerce</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Configuración
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groupedItems.map((group, idx) => (
          <SidebarGroup key={idx}>
            {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={item.url ? pathname.endsWith(item.url) : false}
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
