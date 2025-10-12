import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { companiesService } from "../services/companies";
import { Company } from "../types";
import BranchesModal from "./BranchesModal";
import { useUserRoleStore } from "@/stores/userRoleStore";

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
    <div className="d-flex justify-content-center gap-2">
      {/* Edit Button */}
      <Button
        variant="light"
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleEdit}
        title="Editar empresa"
      >
        <Edit2 size={16} />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant={company.isActive ? "light" : "light"}
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={company.isActive ? "Desactivar empresa" : "Activar empresa"}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : company.isActive ? (
          <XCircle size={16} className="text-danger" />
        ) : (
          <CheckCircle size={16} className="text-success" />
        )}
      </Button>

      {/* Branches Button - Solo visible para Administradores */}
      {getIsAdmin() && (
        <Button
          variant="light"
          size="sm"
          className="rounded-circle"
          style={{ width: "32px", height: "32px", padding: "0" }}
          onClick={handleOpenBranchesModal}
          title="Agregar sucursales"
        >
          <Building2 size={16} className="text-primary" />
        </Button>
      )}

      {/* Branches Modal */}
      {getIsAdmin() && (
        <BranchesModal
          show={showBranchesModal}
          onHide={handleCloseBranchesModal}
          company={company}
          onBranchesUpdated={onCompanyUpdated}
        />
      )}
    </div>
  );
};

export default CompanyActions;
