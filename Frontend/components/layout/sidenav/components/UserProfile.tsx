import Link from "next/link";

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
                  alt={user.username}
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
                {user?.username.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="sidenav-user-name fw-bold">
              {user?.profile.fullName}
            </span>
            <span className="fs-12 fw-semibold" data-lang="user-role">
              {user?.role?.name || "Rol desconocido"}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
