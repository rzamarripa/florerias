import React from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import DepartmentModal from "../components/DepartmentModal";
import { Department } from "../types";
import { deleteDepartment, activateDepartment } from "../services/departments";
import { toast } from "react-toastify";

interface ActionsProps {
  department: Department;
  onDepartmentSaved: () => void;
}

const Actions: React.FC<ActionsProps> = ({ department, onDepartmentSaved }) => {
  const handleToggleStatus = async () => {
    try {
      if (department.isActive) {
        const res = await deleteDepartment(department._id);
        if (res.success) {
          toast.success("Departamento desactivado exitosamente");
          onDepartmentSaved();
        } else {
          toast.error(res.message || "Error al desactivar departamento");
        }
      } else {
        const res = await activateDepartment(department._id);
        if (res.success) {
          toast.success("Departamento activado exitosamente");
          onDepartmentSaved();
        } else {
          toast.error(res.message || "Error al activar departamento");
        }
      }
    } catch (error) {
      const action = department.isActive ? "desactivar" : "activar";
      toast.error(`Error al ${action} el departamento`);
      console.error(`Error ${action} departamento:`, error);
    }
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <DepartmentModal
        mode="edit"
        editingDepartment={department}
        onDepartmentSaved={onDepartmentSaved}
      />

      {department.isActive ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar departamento"
          onClick={handleToggleStatus}
          tabIndex={0}
        >
          <FiTrash2 size={16} />
        </button>
      ) : (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Activar departamento"
          onClick={handleToggleStatus}
          tabIndex={0}
        >
          <BsCheck2 size={16} />
        </button>
      )}
    </div>
  );
};

export default Actions; 