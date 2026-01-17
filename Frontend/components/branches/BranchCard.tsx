"use client";

import { Branch } from "@/stores/activeBranchStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TbBuilding, TbUser, TbMapPin, TbHash } from "react-icons/tb";
import { cn } from "@/lib/utils";

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
  const companyName =
    typeof branch.companyId === "object"
      ? branch.companyId.tradeName || branch.companyId.legalName
      : "";

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
      className={cn(
        "h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        isActive && "border-green-500 border-2"
      )}
      onClick={() => onSelect(branch)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isActive
                  ? "bg-green-100 text-green-600"
                  : "bg-primary/10 text-primary"
              )}
            >
              <TbBuilding size={24} />
            </div>
            <div className="flex-grow">
              <h5 className="font-semibold mb-0">{branch.branchName}</h5>
              {isActive && (
                <Badge variant="default" className="mt-1 bg-green-500">
                  Sucursal Activa
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start">
            <TbHash className="text-muted-foreground mr-2 mt-0.5" size={18} />
            <span className="text-muted-foreground text-sm">Código:</span>
            <span className="ml-2 font-medium">{branch.branchCode}</span>
          </div>

          <div className="flex items-start">
            <TbHash className="text-muted-foreground mr-2 mt-0.5" size={18} />
            <span className="text-muted-foreground text-sm">RFC:</span>
            <Badge variant="secondary" className="ml-2">{branch.rfc}</Badge>
          </div>

          <div className="flex items-start">
            <TbBuilding className="text-muted-foreground mr-2 mt-0.5" size={18} />
            <span className="text-muted-foreground text-sm">Empresa:</span>
            <span className="ml-2 font-medium">{companyName}</span>
          </div>

          <div className="flex items-start">
            <TbUser className="text-muted-foreground mr-2 mt-0.5" size={18} />
            <span className="text-muted-foreground text-sm">Gerente:</span>
            <span className="ml-2 font-medium">{managerName}</span>
          </div>

          <div className="flex items-start">
            <TbMapPin className="text-muted-foreground mr-2 mt-0.5" size={18} />
            <span className="text-muted-foreground text-sm">Dirección:</span>
            <p className="ml-4 mb-0 mt-1 text-sm">{fullAddress}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchCard;
