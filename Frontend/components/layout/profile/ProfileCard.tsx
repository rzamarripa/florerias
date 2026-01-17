import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  coverUrl: string;
  userImage: string;
  fullName: string;
  role: string;
  memberSince: string;
  onChangeCover?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  coverUrl,
  userImage,
  fullName,
  role,
  memberSince,
  onChangeCover,
}) => (
  <Card className="border-0 shadow-sm mb-3 max-w-[500px] mx-auto overflow-hidden">
    <div
      className="h-[180px] bg-cover bg-center relative rounded-t-md"
      style={{ backgroundImage: `url(${coverUrl})` }}
    >
      {onChangeCover && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3 z-10"
          onClick={onChangeCover}
        >
          Cambiar portada
        </Button>
      )}
    </div>
    <div className="relative -top-10 text-center">
      <img
        src={userImage}
        alt="Avatar"
        className="w-20 h-20 rounded-full border-4 border-white object-cover bg-muted"
      />
    </div>
    <CardContent className="-mt-5 text-center pb-6">
      <h4 className="font-bold mb-1">{fullName}</h4>
      <div className="text-primary font-medium mb-0">{role}</div>
      <div className="text-muted-foreground text-sm">
        Miembro desde {memberSince}
      </div>
    </CardContent>
  </Card>
);

export default ProfileCard;
