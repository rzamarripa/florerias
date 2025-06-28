import { Card } from "react-bootstrap";

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
  <Card
    className="border-0 shadow-sm mb-3"
    style={{ maxWidth: 500, margin: "0 auto" }}
  >
    <div
      style={{
        height: 180,
        background: `url(${coverUrl}) center/cover no-repeat`,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        position: "relative",
      }}
    >
      {onChangeCover && (
        <button
          className="btn btn-light btn-sm"
          style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}
          onClick={onChangeCover}
        >
          Cambiar portada
        </button>
      )}
    </div>
    <div style={{ position: "relative", top: -40, textAlign: "center" }}>
      <img
        src={userImage}
        alt="Avatar"
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: "4px solid #fff",
          objectFit: "cover",
          background: "#eee",
        }}
      />
    </div>
    <Card.Body style={{ marginTop: -20, textAlign: "center" }}>
      <h4 className="fw-bold mb-1">{fullName}</h4>
      <div className="text-primary fw-medium mb-0">{role}</div>
      <div className="text-muted mb-0" style={{ fontSize: 14 }}>
        Miembro desde {memberSince}
      </div>
    </Card.Body>
  </Card>
);

export default ProfileCard;
