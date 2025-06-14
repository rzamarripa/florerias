import Image from "next/image";
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "react-bootstrap";
import { TbChevronDown, TbLogout } from "react-icons/tb";

import user2 from "@/assets/images/users/user-2.jpg";
import { useUserSessionStore } from "@/stores";

const UserProfile = () => {
  const { user, logout } = useUserSessionStore();

  const handleLogout = () => {
    logout();
  };

  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <div className="topbar-item nav-user">
      <Dropdown align="end">
        <DropdownToggle
          as={"a"}
          className="topbar-link dropdown-toggle drop-arrow-none px-2"
        >
          <Image
            src={user2.src}
            width="32"
            height="32"
            className="rounded-circle me-lg-2 d-flex"
            alt="user-image"
          />
          <div className="d-lg-flex align-items-center gap-1 d-none">
            <h5 className="my-0">
              {user?.profile?.nombreCompleto
                ? truncateName(user.profile.nombreCompleto)
                : "Usuario"}
            </h5>
            <TbChevronDown className="align-middle" />
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <div className="dropdown-header noti-title">
            <h6 className="text-overflow m-0">
              {user?.profile?.nombreCompleto || "Usuario"}
            </h6>
            <p className="text-muted mb-0 fs-12">
              {user?.role?.name || "Rol desconocido"}
            </p>
            {user?.email && (
              <p className="text-muted mb-0 fs-11">{user.email}</p>
            )}
          </div>
          <DropdownDivider />

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
