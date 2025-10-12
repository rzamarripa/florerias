"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Save } from "lucide-react";
import { toast } from "react-toastify";
import { Branch, CreateBranchData, Manager } from "../types";
import { branchesService } from "../services/branches";
import { companiesService } from "../../companies/services/companies";
import { apiCall } from "@/utils/api";

interface Company {
  _id: string;
  legalName: string;
  rfc: string;
}

interface BranchModalProps {
  show: boolean;
  onHide: () => void;
  branch?: Branch | null;
  onBranchSaved?: () => void;
  userCompany?: any;
}

const BranchModal: React.FC<BranchModalProps> = ({
  show,
  onHide,
  branch,
  onBranchSaved,
  userCompany,
}) => {
  const isEditing = !!branch;

  const [formData, setFormData] = useState<CreateBranchData>({
    branchName: "",
    branchCode: "",
    companyId: "",
    address: {
      street: "",
      externalNumber: "",
      internalNumber: "",
      neighborhood: "",
      city: "",
      state: "",
      postalCode: "",
    },
    manager: "",
    contactPhone: "",
    contactEmail: "",
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      loadCompanies();
      loadManagers();
      if (branch) {
        setFormData({
          branchName: branch.branchName,
          branchCode: branch.branchCode || "",
          companyId: typeof branch.companyId === "string" ? branch.companyId : branch.companyId._id,
          address: branch.address,
          manager: (branch.manager && typeof branch.manager !== "string") ? branch.manager._id : "",
          contactPhone: branch.contactPhone,
          contactEmail: branch.contactEmail,
        });
      } else {
        resetForm();
      }
    }
  }, [show, branch]);

  // Preseleccionar la empresa del usuario cuando se monta el componente
  useEffect(() => {
    if (userCompany && !isEditing) {
      setFormData(prev => ({
        ...prev,
        companyId: userCompany._id
      }));
    }
  }, [userCompany, isEditing]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getAllCompanies({ isActive: true, limit: 1000 });
      setCompanies(response.data || []);
    } catch (err: any) {
      console.error("Error al cargar empresas:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      // Obtener usuarios con rol Gerente
      const response = await apiCall<{ success: boolean; data: Manager[] }>(
        "/users?profile.estatus=true"
      );

      // Filtrar solo usuarios con rol Gerente
      const filteredManagers = (response.data || []).filter(
        (user: any) => user.role?.name === "Gerente"
      );

      setManagers(filteredManagers);
    } catch (err: any) {
      console.error("Error al cargar gerentes:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      branchName: "",
      branchCode: "",
      companyId: "",
      address: {
        street: "",
        externalNumber: "",
        internalNumber: "",
        neighborhood: "",
        city: "",
        state: "",
        postalCode: "",
      },
      manager: "",
      contactPhone: "",
      contactEmail: "",
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Preparar datos, convertir manager vacío a null
      const dataToSend = {
        ...formData,
        manager: formData.manager || null,
      };

      if (isEditing && branch) {
        await branchesService.updateBranch(branch._id, dataToSend);
        toast.success("Sucursal actualizada exitosamente");
      } else {
        await branchesService.createBranch(dataToSend);
        toast.success("Sucursal creada exitosamente");
      }

      onBranchSaved?.();
      onHide();
    } catch (err: any) {
      const errorMessage = err.message || "Error al guardar la sucursal";
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
          {isEditing ? "Editar Sucursal" : "Nueva Sucursal"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
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
          <Form>
            {/* Información Básica */}
            <h6 className="fw-semibold mb-3">Información Básica</h6>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Nombre de la Sucursal <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre de la sucursal"
                    value={formData.branchName}
                    onChange={(e) =>
                      setFormData({ ...formData, branchName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Código</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Código (opcional)"
                    value={formData.branchCode}
                    onChange={(e) =>
                      setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>
                    Empresa <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={userCompany?.tradeName || userCompany?.legalName || ""}
                    disabled
                    readOnly
                  />
                  <Form.Text className="text-muted">
                    Empresa asignada a tu usuario
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Dirección */}
            <h6 className="fw-semibold mb-3">Dirección</h6>
            <Row className="g-3 mb-4">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>
                    Calle <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre de la calle"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>
                    Núm. Ext. <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="123"
                    value={formData.address.externalNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, externalNumber: e.target.value },
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Núm. Int.</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="A"
                    value={formData.address.internalNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, internalNumber: e.target.value },
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Colonia <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Colonia"
                    value={formData.address.neighborhood}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, neighborhood: e.target.value },
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Ciudad <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ciudad"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>
                    Estado <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Estado"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>
                    C.P. <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="12345"
                    maxLength={5}
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postalCode: e.target.value },
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Gerente */}
            <h6 className="fw-semibold mb-3">Gerente (Opcional)</h6>
            <Row className="g-3 mb-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Seleccionar Gerente
                  </Form.Label>
                  <Form.Select
                    value={formData.manager}
                    onChange={(e) =>
                      setFormData({ ...formData, manager: e.target.value })
                    }
                  >
                    <option value="">Sin gerente asignado</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.profile.fullName} - {manager.email}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Solo se muestran usuarios con rol Gerente. Este campo es opcional.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Contacto Principal */}
            <h6 className="fw-semibold mb-3">Contacto Principal</h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Teléfono <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="1234567890"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="contacto@sucursal.com"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
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

export default BranchModal;
