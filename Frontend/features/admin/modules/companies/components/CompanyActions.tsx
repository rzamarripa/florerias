import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, Building2, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { companiesService } from "../services/companies";
import { Company } from "../types";
import BranchesModal from "./BranchesModal";
import WhatsAppConfigModal from "./WhatsAppConfigModal";
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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
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

        {/* WhatsApp Config Button - Solo visible si activeWhatsApp y es Admin */}
        {company.activeWhatsApp && getIsAdmin() && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowWhatsAppModal(true)}
            title="Configuración WhatsApp"
          >
            <MessageSquare className="h-4 w-4 text-green-600" />
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

      {/* WhatsApp Config Modal */}
      {company.activeWhatsApp && getIsAdmin() && (
        <WhatsAppConfigModal
          show={showWhatsAppModal}
          onHide={() => setShowWhatsAppModal(false)}
          company={company}
          onCallback={onCompanyUpdated}
        />
      )}

    </>
  );
};

export default CompanyActions;
