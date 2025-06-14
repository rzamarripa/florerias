import Link from "next/link";

import user2 from "@/assets/images/users/user-2.jpg";
import { useUserSessionStore } from "@/stores";
import Image from "next/image";

const UserProfile = () => {
  const { user } = useUserSessionStore();

  return (
    <div className="sidenav-user">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Link href="/" className="link-reset">
            <Image
              src={user2.src}
              alt="user-image"
              width="36"
              height="36"
              className="rounded-circle mb-2 avatar-md"
            />
            <span className="sidenav-user-name fw-bold">
              {user?.profile.nombreCompleto}
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
