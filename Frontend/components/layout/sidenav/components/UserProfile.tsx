import Link from "next/link";
import { Fragment } from "react";
import { Settings } from "lucide-react";
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "react-bootstrap";
import { userDropdownItems } from "@/config/constants";
import { useUserSessionStore } from "@/stores";
import Image from "next/image";

const UserProfile = () => {
  const { user } = useUserSessionStore();

  return (
    <div className="sidenav-user">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Link href="/" className="link-reset">
            {typeof user?.profile?.image === "string" ? (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(66, 133, 244, 0.3)",
                  position: "relative",
                }}
                className="mb-2 avatar-md"
              >
                <Image
                  src={user.profile.image}
                  alt={user.username}
                  fill
                  style={{
                    objectFit: "cover",
                  }}
                  sizes="36px"
                />
              </div>
            ) : (
              <div
                className="bg-primary text-white d-flex align-items-center justify-content-center fw-bold mb-2 avatar-md"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  fontSize: "16px",
                  border: "2px solid rgba(66, 133, 244, 0.3)",
                }}
              >
                {user?.username.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="sidenav-user-name fw-bold">
              {user?.profile?.fullName || user?.username}
            </span>
            <span className="fs-12 fw-semibold" data-lang="user-role">
              {user?.role?.name || "Usuario"}
            </span>
          </Link>
        </div>
        <Dropdown>
          <DropdownToggle
            as={"a"}
            role="button"
            aria-label="profile dropdown"
            className="dropdown-toggle drop-arrow-none link-reset sidenav-user-set-icon"
          >
            <Settings className="fs-24 align-middle ms-1" size={24} />
          </DropdownToggle>

          <DropdownMenu>
            {userDropdownItems.map((item, idx) => (
              <Fragment key={idx}>
                {item.isHeader ? (
                  <div className="dropdown-header noti-title">
                    <h6 className="text-overflow m-0">{item.label}</h6>
                  </div>
                ) : item.isDivider ? (
                  <DropdownDivider />
                ) : (
                  <DropdownItem
                    as={Link}
                    href={item.url || "#"}
                    className={item.class}
                  >
                    {item.icon && (
                      <item.icon className="me-2 fs-17 align-middle" size={17} />
                    )}
                    <span className="align-middle">{item.label}</span>
                  </DropdownItem>
                )}
              </Fragment>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
};

export default UserProfile;
