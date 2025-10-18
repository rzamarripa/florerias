"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Row, Col, Spinner, Alert } from "react-bootstrap";
import { X, Save, UserPlus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Branch } from "../types";
import { branchesService } from "../services/branches";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { apiCall } from "@/utils/api";

interface Role {
  _id: string;
  name: string;
  description?: string;
}

interface NewEmployeeData {
  username: string;
  email: string;
  phone: string;
  password: string;
  profile: {
    name: string;
    lastName: string;
  };
  role: string;
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
  const { user } = useUserSessionStore();

  // Estado para el formulario de un solo empleado
  const [formData, setFormData] = useState<NewEmployeeData>({
    username: "",
    email: "",
    phone: "",
    password: "",
    profile: {
      name: "",
      lastName: "",
    },
    role: "",
  });

  const [employeesList, setEmployeesList] = useState<NewEmployeeData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si el usuario tiene permisos (Gerente o Administrador)
  const hasPermission = user?.role?.name === "Gerente" || user?.role?.name === "Administrador";

  useEffect(() => {
    if (show) {
      loadRoles();
      resetForm();
      setEmployeesList([]);
      setError(null);
    }
  }, [show]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await apiCall<{ success: boolean; data: Role[] }>("/roles?estatus=true");

      // Filtrar solo roles de empleados (excluir Super Admin, Administrador, Distribuidor)
      const employeeRoles = (response.data || []).filter(
        (role) =>
          role.name !== "Super Admin" &&
          role.name !== "Administrador" &&
          role.name !== "Distribuidor"
      );

      setRoles(employeeRoles);
    } catch (err: any) {
      console.error("Error al cargar roles:", err);
      setError("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      phone: "",
      password: "",
      profile: {
        name: "",
        lastName: "",
      },
      role: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    const keys = field.split(".");

    if (keys.length === 1) {
      setFormData({ ...formData, [keys[0]]: value });
    } else if (keys.length === 2) {
      setFormData({
        ...formData,
        [keys[0]]: {
          ...(formData as any)[keys[0]],
          [keys[1]]: value,
        },
      });
    }
  };

  const validateEmployee = (): boolean => {
    if (!formData.username.trim()) {
      setError("El nombre de usuario es requerido");
      return false;
    }

    if (!formData.email.trim()) {
      setError("El email es requerido");
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("El email no es válido");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("El teléfono es requerido");
      return false;
    }

    if (!formData.password.trim()) {
      setError("La contraseña es requerida");
      return false;
    }

    if (!formData.profile.name.trim()) {
      setError("El nombre es requerido");
      return false;
    }

    if (!formData.profile.lastName.trim()) {
      setError("El apellido es requerido");
      return false;
    }

    if (!formData.role.trim()) {
      setError("El rol es requerido");
      return false;
    }

    // Verificar que el username no esté duplicado en la lista
    const duplicateUsername = employeesList.find(
      (emp) => emp.username.toLowerCase() === formData.username.toLowerCase()
    );
    if (duplicateUsername) {
      setError("Ya existe un empleado con este nombre de usuario en la lista");
      return false;
    }

    // Verificar que el email no esté duplicado en la lista
    const duplicateEmail = employeesList.find(
      (emp) => emp.email.toLowerCase() === formData.email.toLowerCase()
    );
    if (duplicateEmail) {
      setError("Ya existe un empleado con este email en la lista");
      return false;
    }

    return true;
  };

  const handleAddEmployee = () => {
    setError(null);

    if (!validateEmployee()) {
      return;
    }

    // Agregar a la lista
    setEmployeesList([...employeesList, { ...formData }]);

    // Resetear formulario
    resetForm();

    toast.success("Empleado agregado a la lista");
  };

  const handleRemoveEmployee = (index: number) => {
    const updated = [...employeesList];
    updated.splice(index, 1);
    setEmployeesList(updated);
    toast.info("Empleado removido de la lista");
  };

  const getRoleName = (roleId: string): string => {
    const role = roles.find((r) => r._id === roleId);
    return role ? role.name : "N/A";
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (employeesList.length === 0) {
        setError("Debes agregar al menos un empleado a la lista");
        setSaving(false);
        return;
      }

      // Enviar empleados al backend para crearlos y asignarlos a la sucursal
      const response = await branchesService.addEmployeesToBranch(branch._id, {
        employeesData: employeesList,
      });

      if (!response.success) {
        const errorMsg = response.message || "Error al agregar empleados";
        setError(errorMsg);
        toast.error(errorMsg);
        setSaving(false);
        return;
      }

      toast.success(`${employeesList.length} empleado(s) agregado(s) exitosamente`);
      onEmployeesUpdated?.();
      onHide();
    } catch (err: any) {
      const errorMessage = err.message || "Error al agregar empleados";
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
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <UserPlus size={24} className="me-2" />
          Agregar Empleados - {branch.branchName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {!hasPermission && (
          <Alert variant="warning" className="d-flex align-items-center gap-2">
            <X size={24} />
            <div>
              <strong>Permisos insuficientes</strong>
              <p className="mb-0">
                Solo los usuarios con rol <strong>Gerente</strong> o <strong>Administrador</strong> pueden agregar empleados.
              </p>
            </div>
          </Alert>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            {/* Formulario para agregar un empleado */}
            <div className="border rounded p-3 mb-4" style={{ backgroundColor: "#f8f9fa" }}>
              <h6 className="fw-semibold mb-3">Agregar Nuevo Empleado</h6>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      Nombre de Usuario <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre de usuario"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      disabled={!hasPermission}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      Email <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={!hasPermission}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      Teléfono <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Teléfono"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      disabled={!hasPermission}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      Nombre <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre"
                      value={formData.profile.name}
                      onChange={(e) => handleInputChange("profile.name", e.target.value)}
                      disabled={!hasPermission}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      Apellido <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Apellido"
                      value={formData.profile.lastName}
                      onChange={(e) => handleInputChange("profile.lastName", e.target.value)}
                      disabled={!hasPermission}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      Contraseña <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Contraseña"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      disabled={!hasPermission}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>
                      Rol <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={formData.role}
                      onChange={(e) => handleInputChange("role", e.target.value)}
                      disabled={!hasPermission}
                    >
                      <option value="">-- Seleccione un rol --</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="text-end mt-3">
                <Button
                  variant="primary"
                  onClick={handleAddEmployee}
                  disabled={!hasPermission}
                  className="d-flex align-items-center gap-2 ms-auto"
                >
                  <UserPlus size={18} />
                  Agregar a la Lista
                </Button>
              </div>
            </div>

            {/* Tabla de empleados agregados */}
            <div>
              <h6 className="fw-semibold mb-3">
                Empleados a Agregar ({employeesList.length})
              </h6>
              {employeesList.length === 0 ? (
                <Alert variant="info">
                  No hay empleados en la lista. Completa el formulario superior y haz clic en "Agregar a la Lista".
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Rol</th>
                        <th style={{ width: "80px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesList.map((employee, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{employee.username}</td>
                          <td>
                            {employee.profile.name} {employee.profile.lastName}
                          </td>
                          <td>{employee.email}</td>
                          <td>{employee.phone}</td>
                          <td>
                            <span className="badge bg-info">
                              {getRoleName(employee.role)}
                            </span>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              onClick={() => handleRemoveEmployee(index)}
                              title="Quitar de la lista"
                              disabled={!hasPermission}
                            >
                              <Trash2 size={18} />
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
          variant="success"
          onClick={handleSave}
          disabled={saving || !hasPermission || employeesList.length === 0}
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
              Guardar ({employeesList.length})
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmployeesModal;
