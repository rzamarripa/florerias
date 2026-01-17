import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, Building2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { companiesService } from "../services/companies";
import { Company } from "../types";
import BranchesModal from "./BranchesModal";
import AssignRedesModal from "./AssignRedesModal";
import { useUserRoleStore } from "@/stores/userRoleStore";

import { Button } from "@/components/ui/button";

interface CompanyActionsProps {
  company: Company;
  onCompanyUpdated?: () => void;
}

const CompanyActions: React.FC<CompanyActionsProps> = ({
  company,
  onCompanyUpdated,
}) => {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showBranchesModal, setShowBranchesModal] = useState<boolean>(false);
  const [showRedesModal, setShowRedesModal] = useState<boolean>(false);
  const { getIsAdmin } = useUserRoleStore();

  const handleEdit = () => {
    router.push(`/gestion/empresas/${company._id}/editar`);
  };

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      if (company.isActive) {
        await companiesService.deactivateCompany(company._id);
        toast.success("Empresa desactivada correctamente");
      } else {
        await companiesService.activateCompany(company._id);
        toast.success("Empresa activada correctamente");
      }
      onCompanyUpdated?.();
    } catch (error: any) {
      console.error("Error toggling company status:", error);
      const errorMessage =
        error.message ||
        `Error al ${company.isActive ? "desactivar" : "activar"} la empresa`;
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  const handleOpenBranchesModal = () => {
    // Validar que solo administradores puedan asignar sucursales
    if (!getIsAdmin()) {
      toast.warning("Solo usuarios con rol Administrador o Super Admin pueden asignar sucursales");
      return;
    }
    setShowBranchesModal(true);
  };

  const handleCloseBranchesModal = () => {
    setShowBranchesModal(false);
  };

  const handleOpenRedesModal = () => {
    // Validar que solo administradores puedan asignar usuarios redes
    if (!getIsAdmin()) {
      toast.warning("Solo usuarios con rol Administrador o Super Admin pueden asignar usuarios redes");
      return;
    }
    setShowRedesModal(true);
  };

  const handleCloseRedesModal = () => {
    setShowRedesModal(false);
  };

  return (
    <>
      <div className="flex justify-center gap-2">
        {/* Edit Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleEdit}
          title="Editar empresa"
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        {/* Toggle Status Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggleStatus}
          disabled={isToggling}
          title={company.isActive ? "Desactivar empresa" : "Activar empresa"}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : company.isActive ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </Button>

        {/* Branches Button - Solo visible para Administradores */}
        {getIsAdmin() && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleOpenBranchesModal}
            title="Agregar sucursales"
          >
            <Building2 className="h-4 w-4 text-primary" />
          </Button>
        )}

        {/* Assign Redes Button - Solo visible para Administradores */}
        {getIsAdmin() && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleOpenRedesModal}
            title="Asignar usuarios redes"
          >
            <Users className="h-4 w-4 text-blue-500" />
          </Button>
        )}
      </div>

      {/* Branches Modal */}
      {getIsAdmin() && (
        <BranchesModal
          show={showBranchesModal}
          onHide={handleCloseBranchesModal}
          company={company}
          onBranchesUpdated={onCompanyUpdated}
        />
      )}

      {/* Assign Redes Modal */}
      {getIsAdmin() && (
        <AssignRedesModal
          show={showRedesModal}
          onHide={handleCloseRedesModal}
          company={company}
          onRedesUpdated={onCompanyUpdated}
        />
      )}
    </>
  );
};

export default CompanyActions;
