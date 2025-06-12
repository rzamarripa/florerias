import React, { CSSProperties } from "react";

interface RoleBadgeProps {
  role?: { name: string };
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const baseClass = "badge px-2 py-2";

  // Custom inline style for SuperAdmin gradient
  const superAdminStyle: CSSProperties = {
    background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
    color: "#fff"
  };

  const getBadgeProps = (roleName?: string) => {
    switch (roleName) {
      case "SuperAdmin":
      case "Super Admin":
        return {
          className: baseClass,
          style: superAdminStyle
        };
      case "Gerente":
        return {
          className: `${baseClass} bg-primary text-white`
        };
      case "Egresos":
        return {
          className: `${baseClass} bg-warning text-dark`
        };
      case "Sin rol":
        return {
          className: `${baseClass} bg-secondary text-white`
        };
      default:
        return {
          className: `${baseClass} bg-light text-dark`
        };
    }
  };

  const { className, style } = getBadgeProps(role?.name);

  return (
    <span className={className} style={style}>
      {role?.name || "Sin rol"}
    </span>
  );
};

export default RoleBadge;
