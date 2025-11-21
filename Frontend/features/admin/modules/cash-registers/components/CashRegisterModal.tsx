"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Save, X } from "lucide-react";
import { toast } from "react-toastify";
import { CashRegister, CreateCashRegisterData, Branch, User } from "../types";
import { cashRegistersService } from "../services/cashRegisters";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface CashRegisterModalProps {
  show: boolean;
  onHide: () => void;
  cashRegister?: CashRegister | null;
  onCashRegisterSaved?: () => void;
  isSocialMediaBox?: boolean;
}

const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  show,
  onHide,
  cashRegister,
  onCashRegisterSaved,
  isSocialMediaBox = false,
}) => {
  const isEditing = !!cashRegister;
  const { getUserId } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const { role } = useUserRoleStore();
  const userId = getUserId();
  const isAdministrator = role?.toLowerCase() === "administrador";
  const isManager = role?.toLowerCase() === "gerente";

  // Para administradores: verificar si hay sucursal seleccionada
  // Para gerentes: siempre pueden crear porque se obtiene su sucursal del backend
  const canCreate =
    isManager ||
    !isAdministrator ||
    (isAdministrator && activeBranch) ||
    isEditing;

  const [formData, setFormData] = useState<CreateCashRegisterData>({
    name: "",
    branchId: "",
    cashierId: null,
    managerId: "",
    initialBalance: 0,
    isSocialMediaBox: false,
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [boxType, setBoxType] = useState<"normal" | "social">("normal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (show && userId) {
      loadEmployeesByRole();
      if (cashRegister) {
        setFormData({
          name: cashRegister.name,
          branchId:
            typeof cashRegister.branchId === "string"
              ? cashRegister.branchId
              : cashRegister.branchId._id,
          cashierId: cashRegister.cashierId
            ? typeof cashRegister.cashierId === "string"
              ? cashRegister.cashierId
              : cashRegister.cashierId._id
            : null,
          managerId:
            typeof cashRegister.managerId === "string"
              ? cashRegister.managerId
              : cashRegister.managerId._id,
          initialBalance: cashRegister.initialBalance,
        });
      } else {
        resetForm();
        // Pre-seleccionar tipo de caja si viene del prop
        if (isSocialMediaBox) {
          setBoxType("social");
          setFormData((prev) => ({
            ...prev,
            isSocialMediaBox: true,
          }));
        }
        // Para administradores: pre-seleccionar activeBranch si existe
        if (isAdministrator && activeBranch) {
          setFormData((prev) => ({
            ...prev,
            branchId: activeBranch._id,
          }));
        }
      }
    }
  }, [show, cashRegister, userId, isAdministrator, isManager, activeBranch, isSocialMediaBox]);

  const loadEmployeesByRole = async () => {
    try {
      if (!userId) return;
      setLoading(true);

      let response;
      if (isManager) {
        // Para gerentes: obtener su sucursal desde el backend
        response = await cashRegistersService.getManagerBranch(userId);
      } else {
        // Para administradores: obtener todas sus sucursales
        response = await cashRegistersService.getCashiersAndManagersByAdmin(
          userId
        );
      }

      if (response.data) {
        setBranches(response.data.branches || []);
        setManagers(response.data.managers || []);

        // Si es gerente, pre-seleccionar su sucursal y su usuario como gerente
        if (isManager && response.data.branches.length > 0 && !cashRegister) {
          const branch = response.data.branches[0];
          setManagerBranch(branch);
          setFormData((prev) => ({
            ...prev,
            branchId: branch._id,
            managerId: userId, // El gerente se asigna a sí mismo
          }));
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos");
      toast.error("Error al cargar los datos necesarios");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      branchId: "",
      cashierId: null,
      managerId: "",
      initialBalance: 0,
      isSocialMediaBox: false,
    });
    setBoxType("normal");
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Si es el campo initialBalance, convertir a número
    if (name === "initialBalance") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Cuando se selecciona el tipo de caja
  const handleBoxTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as "normal" | "social";
    setBoxType(type);
    setFormData((prev) => ({
      ...prev,
      isSocialMediaBox: type === "social",
    }));
  };

  // Cuando se selecciona una sucursal, autocompletar gerente
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      branchId,
    }));

    // Buscar el gerente de esta sucursal
    const selectedBranch = branches.find((b) => b._id === branchId);
    if (selectedBranch && managers.length > 0) {
      // Asumiendo que cada sucursal tiene un gerente específico
      // El backend ya filtra los gerentes correctamente
      const branchManager = managers.find(() => {
        // Esta lógica puede necesitar ajuste dependiendo de cómo se relacionan
        return true; // Por ahora aceptamos cualquier gerente disponible
      });

      if (branchManager) {
        setFormData((prev) => ({
          ...prev,
          managerId: branchManager._id,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar sucursal para administradores (los gerentes ya tienen su sucursal asignada)
    if (isAdministrator && !isEditing && !activeBranch) {
      toast.error(
        "Debes seleccionar una sucursal antes de crear una caja registradora"
      );
      return;
    }

    if (!formData.name || !formData.branchId || !formData.managerId) {
      setError("El nombre, sucursal y gerente son obligatorios");
      return;
    }

    try {
      setSaving(true);

      if (isEditing && cashRegister) {
        // Al editar, no enviar cashierId ni isSocialMediaBox para no modificarlo (inmutable)
        const { cashierId, isSocialMediaBox, ...updateData } = formData;
        await cashRegistersService.updateCashRegister(
          cashRegister._id,
          updateData
        );
        toast.success("Caja registradora actualizada exitosamente");
      } else {
        // Al crear, enviar los datos con isSocialMediaBox según el tipo seleccionado
        // El cashierId siempre será null, se asignará cuando se abra la caja
        await cashRegistersService.createCashRegister(formData);
        toast.success("Caja registradora creada exitosamente");
      }

      if (onCashRegisterSaved) {
        onCashRegisterSaved();
      }

      onHide();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al guardar la caja registradora");
      toast.error(err.message || "Error al guardar la caja registradora");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      backdrop="static"
      centered
    >
      <Modal.Header closeButton style={{ borderBottom: "2px solid #f1f3f5" }}>
        <Modal.Title className="fw-bold">
          {isEditing ? "Editar Caja Registradora" : "Nueva Caja Registradora"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {/* Alerta para administradores sin sucursal seleccionada */}
          {isAdministrator && !activeBranch && !isEditing && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading className="fs-6 fw-bold">
                Sucursal requerida
              </Alert.Heading>
              <p className="mb-0 small">
                Debes seleccionar una sucursal antes de crear una caja
                registradora. Ve a tu perfil y selecciona una sucursal activa.
              </p>
            </Alert>
          )}

          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando datos...</p>
            </div>
          ) : (
            <Row className="g-3">
              {/* Nombre de la Caja */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre de la Caja <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Caja 1, Caja Principal"
                    required
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Group>
              </Col>

              {/* Tipo de Caja - Solo en creación */}
              {!isEditing && (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Tipo de Caja <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={boxType}
                      onChange={handleBoxTypeChange}
                      required
                      disabled={isSocialMediaBox}
                      style={{ borderRadius: "8px" }}
                    >
                      <option value="normal">Caja Normal (Tienda)</option>
                      <option value="social">Caja Redes Sociales</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Este campo no puede modificarse después de crear la caja
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}

              {/* Mostrar tipo de caja cuando está editando */}
              {isEditing && (
                <Col md={12}>
                  <Alert
                    variant={cashRegister?.isSocialMediaBox ? "warning" : "info"}
                    className="d-flex align-items-center"
                  >
                    <strong className="me-2">Tipo de Caja:</strong>
                    {cashRegister?.isSocialMediaBox ? "Caja Redes Sociales" : "Caja Normal (Tienda)"}
                  </Alert>
                </Col>
              )}

              {/* Sucursal - Solo mostrar select para NO administradores/gerentes o cuando está editando */}
              {!isAdministrator && !isManager && !isEditing && (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Sucursal <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleBranchChange}
                      required
                      disabled={isEditing}
                      style={{ borderRadius: "8px" }}
                    >
                      <option value="">Seleccione una sucursal</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.branchName}
                        </option>
                      ))}
                    </Form.Select>
                    {isEditing && (
                      <Form.Text className="text-muted">
                        La sucursal no puede modificarse al editar
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              )}

              {/* Mostrar nombre de sucursal seleccionada para administradores en modo creación */}
              {isAdministrator && !isEditing && activeBranch && (
                <Col md={12}>
                  <Alert variant="info" className="d-flex align-items-center">
                    <strong className="me-2">Sucursal:</strong>
                    {activeBranch.branchName}
                  </Alert>
                </Col>
              )}

              {/* Mostrar nombre de sucursal para gerentes en modo creación */}
              {isManager && !isEditing && managerBranch && (
                <Col md={12}>
                  <Alert variant="info" className="d-flex align-items-center">
                    <strong className="me-2">Sucursal:</strong>
                    {managerBranch.branchName}
                  </Alert>
                </Col>
              )}

              {/* Gerente */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Gerente <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    required
                    disabled={isManager && !isEditing}
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="">Seleccione un gerente</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.profile.fullName} - {manager.email}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {isManager
                      ? "Automáticamente asignado a ti como gerente de la sucursal"
                      : "Se autocompletará al seleccionar la sucursal"}
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Nota sobre el cajero - Solo para cajas normales */}
              {boxType === "normal" && !isEditing && (
                <Col md={12}>
                  <Alert variant="info" className="mb-0">
                    <small>
                      <strong>Nota:</strong> El cajero se asignará automáticamente
                      cuando un usuario con rol "Cajero" abra la caja
                      registradora.
                    </small>
                  </Alert>
                </Col>
              )}

              {/* Nota para cajas de redes sociales */}
              {boxType === "social" && !isEditing && (
                <Col md={12}>
                  <Alert variant="warning" className="mb-0">
                    <small>
                      <strong>Importante:</strong> Esta caja solo podrá ser abierta
                      y cerrada por usuarios con rol "Redes". El usuario de redes
                      se asignará automáticamente cuando abra la caja.
                    </small>
                  </Alert>
                </Col>
              )}

              {/* Saldo Inicial */}
              {!isEditing && (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Saldo Inicial
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="initialBalance"
                      value={formData.initialBalance || 0}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{ borderRadius: "8px" }}
                    />
                    <Form.Text className="text-muted">
                      El saldo inicial con el que abre la caja (opcional, por
                      defecto 0)
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer style={{ borderTop: "2px solid #f1f3f5" }}>
          <Button
            variant="light"
            onClick={handleClose}
            disabled={saving}
            className="px-4"
            style={{ borderRadius: "8px" }}
          >
            <X size={18} className="me-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || loading || !canCreate}
            className="px-4"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
            }}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} className="me-2" />
                {isEditing ? "Actualizar" : "Crear"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CashRegisterModal;
