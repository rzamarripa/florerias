"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Spinner, Alert } from "react-bootstrap";
import Select from "react-select";
import { X, Save, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { Branch, Employee } from "../types";
import { branchesService } from "../services/branches";
import { apiCall } from "@/utils/api";

interface EmployeeOption {
  value: string;
  label: string;
  employee: Employee;
}

interface EmployeesModalProps {
  show: boolean;
  onHide: () => void;
  branch: Branch;
  onEmployeesUpdated?: () => void;
}

const EmployeesModal: React.FC<EmployeesModalProps> = ({
  show,
  onHide,
  branch,
  onEmployeesUpdated,
}) => {
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      loadEmployees();
    }
  }, [show]);

  useEffect(() => {
    if (allEmployees.length > 0 && branch) {
      // Obtener IDs de empleados actuales
      const currentEmployeeIds =
        branch.employees?.map((emp: any) =>
          typeof emp === "string" ? emp : emp._id
        ) || [];

      setSelectedEmployeeIds(currentEmployeeIds);

      // Convertir a opciones
      const options = currentEmployeeIds
        .map((id) => {
          const employee = allEmployees.find((e) => e._id === id);
          if (employee) {
            return {
              value: employee._id,
              label: `${employee.profile.fullName} (${employee.role.name}) - ${employee.email}`,
              employee,
            };
          }
          return null;
        })
        .filter((opt): opt is EmployeeOption => opt !== null);

      setSelectedOptions(options);
    }
  }, [allEmployees, branch]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todos los usuarios activos excluyendo los roles de admin
      const response = await apiCall<{ success: boolean; data: Employee[] }>(
        "/users?profile.estatus=true"
      );

      // Filtrar solo usuarios que no sean Admin, Super Admin o Distribuidor
      const filteredEmployees = (response.data || []).filter(
        (user) =>
          user.role.name !== "Administrador" &&
          user.role.name !== "Super Admin" &&
          user.role.name !== "Distribuidor"
      );

      setAllEmployees(filteredEmployees);
    } catch (err: any) {
      console.error("Error al cargar empleados:", err);
      setError(err.message || "Error al cargar los empleados");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelection = (newValue: readonly EmployeeOption[]) => {
    setSelectedOptions(newValue as EmployeeOption[]);
    setSelectedEmployeeIds(newValue.map((opt) => opt.value));
  };

  const getEmployeeOptions = (): EmployeeOption[] => {
    return allEmployees.map((employee) => ({
      value: employee._id,
      label: `${employee.profile.fullName} (${employee.role.name}) - ${employee.email}`,
      employee,
    }));
  };

  const handleRemoveEmployee = (employeeId: string) => {
    const newSelectedIds = selectedEmployeeIds.filter((id) => id !== employeeId);
    const newSelectedOptions = selectedOptions.filter((opt) => opt.value !== employeeId);
    setSelectedEmployeeIds(newSelectedIds);
    setSelectedOptions(newSelectedOptions);
  };

  const getSelectedEmployees = (): Employee[] => {
    return allEmployees.filter((emp) => selectedEmployeeIds.includes(emp._id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Actualizar la sucursal con los nuevos empleados
      await branchesService.updateBranch(branch._id, {
        employees: selectedEmployeeIds,
      });

      toast.success("Empleados actualizados exitosamente");
      onEmployeesUpdated?.();
      onHide();
    } catch (err: any) {
      const errorMessage = err.message || "Error al actualizar los empleados";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <UserPlus size={24} className="me-2" />
          Gestionar Empleados - {branch.branchName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            {/* Multiselect de Empleados con React-Select */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                Seleccionar Empleados
              </Form.Label>
              <Select
                isMulti
                options={getEmployeeOptions()}
                value={selectedOptions}
                onChange={handleEmployeeSelection}
                placeholder="Selecciona empleados..."
                noOptionsMessage={() => "No hay empleados disponibles"}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "42px",
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
              <Form.Text className="text-muted">
                Solo se muestran usuarios con roles diferentes a Administrador, Super Admin y Distribuidor
              </Form.Text>
            </Form.Group>

            {/* Tabla de Empleados Asignados */}
            <div className="mt-4">
              <h6 className="fw-semibold mb-3">
                Empleados Asignados ({getSelectedEmployees().length})
              </h6>
              {getSelectedEmployees().length === 0 ? (
                <Alert variant="info">
                  No hay empleados asignados. Selecciona empleados del listado
                  superior.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th style={{ width: "60px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSelectedEmployees().map((employee) => (
                        <tr key={employee._id}>
                          <td>{employee.profile.fullName}</td>
                          <td>
                            <span className="badge bg-info">
                              {employee.role.name}
                            </span>
                          </td>
                          <td>{employee.email}</td>
                          <td>{employee.phone || "N/A"}</td>
                          <td className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              onClick={() => handleRemoveEmployee(employee._id)}
                              title="Quitar empleado"
                            >
                              <X size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || loading}
          className="d-flex align-items-center gap-2"
        >
          {saving ? (
            <>
              <Spinner
                animation="border"
                size="sm"
                style={{ width: "16px", height: "16px" }}
              />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              Guardar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmployeesModal;
