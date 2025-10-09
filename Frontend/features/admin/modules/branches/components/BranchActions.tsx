import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { branchesService } from "../services/branches";
import { Branch } from "../types";
import BranchModal from "./BranchModal";
import EmployeesModal from "./EmployeesModal";

interface BranchActionsProps {
  branch: Branch;
  onBranchUpdated?: () => void;
}

const BranchActions: React.FC<BranchActionsProps> = ({
  branch,
  onBranchUpdated,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState<boolean>(false);

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
        {/* Edit Button */}
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

        {/* Toggle Status Button */}
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

        {/* Employees Button */}
        <Button
          variant="light"
          size="sm"
          className="rounded-circle"
          style={{ width: "32px", height: "32px", padding: "0" }}
          onClick={() => setShowEmployeesModal(true)}
          title="Gestionar empleados"
        >
          <UserPlus size={16} className="text-primary" />
        </Button>
      </div>

      {/* Edit Modal */}
      <BranchModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        branch={branch}
        onBranchSaved={onBranchUpdated}
      />

      {/* Employees Modal */}
      <EmployeesModal
        show={showEmployeesModal}
        onHide={() => setShowEmployeesModal(false)}
        branch={branch}
        onEmployeesUpdated={onBranchUpdated}
      />
    </>
  );
};

export default BranchActions;
