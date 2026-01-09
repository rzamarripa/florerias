import Image from "next/image";
import Link from "next/link";
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "react-bootstrap";
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
      <Dropdown align="end">
        <DropdownToggle
          as={"a"}
          className="topbar-link dropdown-toggle drop-arrow-none px-2"
        >
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
              className="bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
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
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <div className="dropdown-header noti-title">
            <h6 className="text-overflow m-0">
              {user?.profile?.fullName || "Usuario"}
            </h6>
            <p className="text-muted mb-0 fs-12">
              {user?.role?.name || "Rol desconocido"}
            </p>
            {user?.email && (
              <p className="text-muted mb-0 fs-11">{user.email}</p>
            )}
          </div>
          <DropdownDivider />

          {isManager && (
            <>
              <DropdownItem as={Link} href="/ecommerce/configuracion">
                <TbShoppingCart className="me-2 fs-17 align-middle" />
                <span className="align-middle">Configuración e-commerce</span>
              </DropdownItem>
              <DropdownDivider />
            </>
          )}

          <DropdownItem onClick={handleLogout} style={{ cursor: "pointer" }}>
            <TbLogout className="me-2 fs-17 align-middle" />
            <span className="align-middle">Cerrar Sesión</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default UserProfile;
