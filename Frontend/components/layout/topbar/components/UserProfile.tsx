"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TbChevronDown, TbLogout, TbShoppingCart } from "react-icons/tb";
import { useUserSessionStore } from "@/stores";
import { useUserRoleStore } from "@/stores/userRoleStore";

const UserProfile = () => {
  const { user, logout } = useUserSessionStore();
  const { getIsManager } = useUserRoleStore();
  const isManager = getIsManager();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="topbar-item nav-user">
      <DropdownMenu>
        <DropdownMenuTrigger className="topbar-link flex items-center gap-1 px-2 outline-none">
          {typeof user?.profile?.image === "string" ? (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #e9ecef",
                position: "relative",
              }}
            >
              <Image
                src={user.profile.image}
                alt={user?.username || "Usuario"}
                fill
                style={{
                  objectFit: "cover",
                }}
                sizes="40px"
              />
            </div>
          ) : (
            <div
              className="bg-primary text-primary-foreground flex items-center justify-center font-bold"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                fontSize: "16px",
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <TbChevronDown className="align-middle" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <h6 className="font-semibold truncate">
              {user?.profile?.fullName || "Usuario"}
            </h6>
            <p className="text-muted-foreground text-xs mb-0">
              {user?.role?.name || "Rol desconocido"}
            </p>
            {user?.email && (
              <p className="text-muted-foreground text-xs mb-0">{user.email}</p>
            )}
          </div>
          <DropdownMenuSeparator />

          {isManager && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/ecommerce/configuracion">
                  <TbShoppingCart className="mr-2" size={17} />
                  <span>Configuración e-commerce</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <TbLogout className="mr-2" size={17} />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;
