import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, UserPlus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { branchesService } from "../services/branches";
import { Branch } from "../types";
import BranchModal from "./BranchModal";
import EmployeesModal from "./EmployeesModal";
import ViewEmployeesModal from "./ViewEmployeesModal";
import { useUserRoleStore } from "@/stores/userRoleStore";

import { Button } from "@/components/ui/button";

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
      <div className="flex justify-center gap-2">
        {/* Edit Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowEditModal(true)}
            title="Editar sucursal"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}

        {/* Toggle Status Button - Solo visible para Administradores */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleToggleStatus}
            disabled={isToggling}
            title={branch.isActive ? "Desactivar sucursal" : "Activar sucursal"}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : branch.isActive ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </Button>
        )}

        {/* View Employees Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowViewEmployeesModal(true)}
          title="Ver empleados"
        >
          <Users className="h-4 w-4 text-blue-500" />
        </Button>

        {/* Add Employees Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowEmployeesModal(true)}
          title="Agregar empleados"
        >
          <UserPlus className="h-4 w-4 text-primary" />
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
