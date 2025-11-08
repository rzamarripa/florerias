"use client";

import { Branch } from "@/stores/activeBranchStore";
import { Card, Badge } from "react-bootstrap";
import { TbBuilding, TbUser, TbMapPin, TbHash } from "react-icons/tb";

interface BranchCardProps {
  branch: Branch;
  isActive?: boolean;
  onSelect: (branch: Branch) => void;
}

const BranchCard = ({
  branch,
  isActive = false,
  onSelect,
}: BranchCardProps) => {
  // Manejar el caso donde companyId puede ser string u objeto
  const companyName =
    typeof branch.companyId === "object"
      ? branch.companyId.tradeName || branch.companyId.legalName
      : "";

  // Manejar el caso donde manager puede ser string u objeto
  const managerName =
    typeof branch.manager === "object"
      ? branch.manager.profile?.fullName ||
        branch.manager.username ||
        "Sin asignar"
      : "Sin asignar";

  const fullAddress = `${branch.address.street} ${
    branch.address.externalNumber
  }${
    branch.address.internalNumber
      ? ` Int. ${branch.address.internalNumber}`
      : ""
  }, ${branch.address.neighborhood}, ${branch.address.city}, ${
    branch.address.state
  }, ${branch.address.postalCode}`;

  return (
    <Card
      className={`branch-card h-100 ${isActive ? "border-success" : ""}`}
      style={{ cursor: "pointer", transition: "all 0.3s" }}
      onClick={() => onSelect(branch)}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className={`icon-circle ${
                isActive
                  ? "bg-success-subtle text-success"
                  : "bg-primary-subtle text-primary"
              }`}
            >
              <TbBuilding size={24} />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-0">{branch.branchName}</h5>
              {isActive && (
                <Badge
                  bg="success"
                  className="mt-1"
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    fontWeight: "600",
                    opacity: 1,
                  }}
                >
                  Sucursal Activa
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="branch-details">
          <div className="detail-item mb-2">
            <TbHash className="text-muted me-2" size={18} />
            <span className="text-muted small">Código:</span>
            <span className="ms-2 fw-medium">{branch.branchCode}</span>
          </div>

          <div className="detail-item mb-2">
            <TbBuilding className="text-muted me-2" size={18} />
            <span className="text-muted small">Empresa:</span>
            <span className="ms-2 fw-medium">{companyName}</span>
          </div>

          <div className="detail-item mb-2">
            <TbUser className="text-muted me-2" size={18} />
            <span className="text-muted small">Gerente:</span>
            <span className="ms-2 fw-medium">{managerName}</span>
          </div>

          <div className="detail-item">
            <TbMapPin className="text-muted me-2" size={18} />
            <span className="text-muted small">Dirección:</span>
            <p className="ms-4 mb-0 mt-1 small">{fullAddress}</p>
          </div>
        </div>
      </Card.Body>

      <style jsx>{`
        .branch-card {
          transition: all 0.3s ease;
        }

        .branch-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }

        .icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
        }
      `}</style>
    </Card>
  );
};

export default BranchCard;
