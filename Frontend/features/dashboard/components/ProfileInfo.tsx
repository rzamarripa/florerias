import coverDefault from "@/assets/images/auth.jpg";
import userImageDefault from "@/assets/images/users/user-2.jpg";
import UnsplashSelector from "@/components/common/UnspashSelector";
import ProfileCard from "@/components/layout/profile/ProfileCard";
import { usersService } from "@/features/admin/modules/users/services/users";
import { useUserSessionStore } from "@/stores";
import { format } from "date-fns";
import { useState } from "react";

const ProfileInfo = () => {
  const { user } = useUserSessionStore();
  const profile = user?.profile;
  const role = user?.role?.name || "Sin rol";
  const memberSince = user?.createdAt
    ? format(new Date(user.createdAt), "d 'de' MMMM 'de' yyyy")
    : "Desconocido";

  const profileName = profile?.name || "";
  const profileLastName = profile?.lastName || "";
  const profileFullName = profile?.fullName || "";
  const profilePath = profile?.path || "";
  const profileEstatus = profile?.estatus ?? true;
  const profileCoverUrl = profile?.path || coverDefault.src;

  const [cover, setCover] = useState<string>(profileCoverUrl);
  const [showUnsplash, setShowUnsplash] = useState(false);
  const userId = user?._id;

  const handleSelectCover = async (url: string) => {
    setCover(url);
    setShowUnsplash(false);
    if (userId) {
      await usersService.updateUser(userId, {
        profile: {
          name: profileName,
          fullName: profileFullName,
          path: profilePath,
          estatus: profileEstatus,
          lastName: profileLastName,
        },
      });
    }
  };

  const getUserImage = () => {
    if (typeof profile?.image === "string") {
      return profile.image;
    }
    if (profile?.image?.data) {
      return profile.image.data;
    }
    return userImageDefault.src;
  };

  return (
    <>
      <ProfileCard
        coverUrl={cover}
        userImage={getUserImage()}
        fullName={profile?.fullName || user?.username || "Usuario"}
        role={role}
        memberSince={memberSince}
        onChangeCover={() => setShowUnsplash(true)}
      />
      <UnsplashSelector
        show={showUnsplash}
        onClose={() => setShowUnsplash(false)}
        onSelect={handleSelectCover}
      />
    </>
  );
};

export default ProfileInfo;
