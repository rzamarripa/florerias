import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle, UserPlus, Users } from "lucide-react";
import { toast } from "react-toastify";
import { branchesService } from "../services/branches";
import { Branch } from "../types";
import BranchModal from "./BranchModal";
import EmployeesModal from "./EmployeesModal";
import ViewEmployeesModal from "./ViewEmployeesModal";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface BranchActionsProps {
  branch: Branch;
  onBranchUpdated?: () => void;
  userCompany?: any;
}

const BranchActions: React.FC<BranchActionsProps> = ({
  branch,
  onBranchUpdated,
  userCompany,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState<boolean>(false);
  const [showViewEmployeesModal, setShowViewEmployeesModal] = useState<boolean>(false);
  const { getIsAdmin } = useUserRoleStore();
  const isAdmin = getIsAdmin();

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      if (branch.isActive) {
        await branchesService.deactivateBranch(branch._id);
        toast.success("Sucursal desactivada correctamente");
      } else {
        await branchesService.activateBranch(branch._id);
        toast.success("Sucursal activada correctamente");
      }
      onBranchUpdated?.();
    } catch (error: any) {
      console.error("Error toggling branch status:", error);
      const errorMessage =
        error.message ||
        `Error al ${branch.isActive ? "desactivar" : "activar"} la sucursal`;
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-2">
        {/* Edit Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant="light"
            size="sm"
            className="rounded-circle"
            style={{ width: "32px", height: "32px", padding: "0" }}
            onClick={() => setShowEditModal(true)}
            title="Editar sucursal"
          >
            <Edit2 size={16} />
          </Button>
        )}

        {/* Toggle Status Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant={branch.isActive ? "light" : "light"}
            size="sm"
            className="rounded-circle"
            style={{ width: "32px", height: "32px", padding: "0" }}
            onClick={handleToggleStatus}
            disabled={isToggling}
            title={branch.isActive ? "Desactivar sucursal" : "Activar sucursal"}
          >
            {isToggling ? (
              <Spinner
                animation="border"
                size="sm"
                style={{ width: "16px", height: "16px" }}
              />
            ) : branch.isActive ? (
              <XCircle size={16} className="text-danger" />
            ) : (
              <CheckCircle size={16} className="text-success" />
            )}
          </Button>
        )}

        {/* View Employees Button */}
        <Button
          variant="light"
          size="sm"
          className="rounded-circle"
          style={{ width: "32px", height: "32px", padding: "0" }}
          onClick={() => setShowViewEmployeesModal(true)}
          title="Ver empleados"
        >
          <Users size={16} className="text-info" />
        </Button>

        {/* Add Employees Button */}
        <Button
          variant="light"
          size="sm"
          className="rounded-circle"
          style={{ width: "32px", height: "32px", padding: "0" }}
          onClick={() => setShowEmployeesModal(true)}
          title="Agregar empleados"
        >
          <UserPlus size={16} className="text-primary" />
        </Button>
      </div>

      {/* Edit Modal - Solo para Administradores */}
      {isAdmin && (
        <BranchModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          branch={branch}
          onBranchSaved={onBranchUpdated}
          userCompany={userCompany}
        />
      )}

      {/* Employees Modal */}
      <EmployeesModal
        show={showEmployeesModal}
        onHide={() => setShowEmployeesModal(false)}
        branch={branch}
        onEmployeesUpdated={onBranchUpdated}
      />

      {/* View Employees Modal */}
      <ViewEmployeesModal
        show={showViewEmployeesModal}
        onHide={() => setShowViewEmployeesModal(false)}
        branch={branch}
      />
    </>
  );
};

export default BranchActions;
