import coverDefault from "@/assets/images/auth.jpg";
import userImageDefault from "@/assets/images/users/user-2.jpg";
import UnsplashSelector from "@/components/common/UnspashSelector";
import ProfileCard from "@/components/layout/profile/ProfileCard";
import { usersService } from "@/features/admin/modules/users/services/users";
import { useUserSessionStore } from "@/stores";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiCall } from "@/utils/api";

const ProfileInfo = () => {
  const { user, setUser, token } = useUserSessionStore();
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

  // Lógica mejorada: si hay path del usuario, úsalo; si no, usa el default
  const profileCoverUrl = profilePath || coverDefault.src;

  const [cover, setCover] = useState<string>(profileCoverUrl);
  const [showUnsplash, setShowUnsplash] = useState(false);
  const userId = user?._id;

  // Actualizar el estado local cuando cambie el perfil del usuario
  useEffect(() => {
    if (profilePath) {
      setCover(profilePath);
    } else {
      setCover(coverDefault.src);
    }
  }, [profilePath]);

  const handleSelectCover = async (url: string) => {
    setCover(url);
    setShowUnsplash(false);

    if (userId) {
      try {
        // Tipar la respuesta para evitar error de linter
        type CoverResponse = { user: typeof user };
        const response = await apiCall<CoverResponse>(
          `/users/${userId}/cover`,
          {
            method: "PUT",
            body: JSON.stringify({ path: url }),
          }
        );
        if (response.success && response.data && response.data.user) {
          setUser(
            {
              ...user,
              profile: {
                ...user?.profile,
                path: url,
              },
            },
            token || null
          );
          toast.success("✅ Portada actualizada correctamente");
        } else {
          toast.error("❌ Error al actualizar la portada");
        }
      } catch (error) {
        setCover(profileCoverUrl);
        toast.error("❌ Error al actualizar la portada");
      }
    } else {
      toast.error("❌ Error: Usuario no identificado");
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
        coverUrl={typeof cover === "string" ? cover : coverDefault.src}
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
