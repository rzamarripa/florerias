"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Save, X } from "lucide-react";
import { toast } from "react-toastify";
import { CashRegister, CreateCashRegisterData, Branch, User } from "../types";
import { cashRegistersService } from "../services/cashRegisters";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface CashRegisterModalProps {
  show: boolean;
  onHide: () => void;
  cashRegister?: CashRegister | null;
  onCashRegisterSaved?: () => void;
}

const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  show,
  onHide,
  cashRegister,
  onCashRegisterSaved,
}) => {
  const isEditing = !!cashRegister;
  const { getUserId } = useUserSessionStore();
  const userId = getUserId();

  const [formData, setFormData] = useState<CreateCashRegisterData>({
    name: "",
    branchId: "",
    cashierId: "",
    managerId: "",
    initialBalance: 0,
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && userId) {
      loadEmployeesByAdmin();
      if (cashRegister) {
        setFormData({
          name: cashRegister.name,
          branchId: typeof cashRegister.branchId === "string" ? cashRegister.branchId : cashRegister.branchId._id,
          cashierId: typeof cashRegister.cashierId === "string" ? cashRegister.cashierId : cashRegister.cashierId._id,
          managerId: typeof cashRegister.managerId === "string" ? cashRegister.managerId : cashRegister.managerId._id,
          initialBalance: cashRegister.initialBalance,
        });
      } else {
        resetForm();
      }
    }
  }, [show, cashRegister, userId]);

  const loadEmployeesByAdmin = async () => {
    try {
      if (!userId) return;
      setLoading(true);
      const response = await cashRegistersService.getCashiersAndManagersByAdmin(userId);

      if (response.data) {
        setBranches(response.data.branches || []);
        setCashiers(response.data.cashiers || []);
        setManagers(response.data.managers || []);
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
      cashierId: "",
      managerId: "",
      initialBalance: 0,
    });
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  // Cuando se selecciona una sucursal, autocompletar gerente
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      branchId,
    }));

    // Buscar el gerente de esta sucursal
    const selectedBranch = branches.find(b => b._id === branchId);
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

    if (!formData.name || !formData.branchId || !formData.cashierId || !formData.managerId) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setSaving(true);

      if (isEditing && cashRegister) {
        await cashRegistersService.updateCashRegister(cashRegister._id, formData);
        toast.success("Caja registradora actualizada exitosamente");
      } else {
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
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static" centered>
      <Modal.Header closeButton style={{ borderBottom: "2px solid #f1f3f5" }}>
        <Modal.Title className="fw-bold">
          {isEditing ? "Editar Caja Registradora" : "Nueva Caja Registradora"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
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

              {/* Sucursal */}
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
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="">Seleccione una sucursal</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

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
                    Se autocompletará al seleccionar la sucursal
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Cajero */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Cajero <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="cashierId"
                    value={formData.cashierId}
                    onChange={handleInputChange}
                    required
                    style={{ borderRadius: "8px" }}
                  >
                    <option value="">Seleccione un cajero</option>
                    {cashiers.map((cashier) => (
                      <option key={cashier._id} value={cashier._id}>
                        {cashier.profile.fullName} - {cashier.email}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Solo cajeros de las sucursales asignadas
                  </Form.Text>
                </Form.Group>
              </Col>

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
                      El saldo inicial con el que abre la caja (opcional, por defecto 0)
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
            disabled={saving || loading}
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
