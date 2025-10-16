"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Save, X, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { Branch, CreateBranchData, Manager } from "../types";
import { branchesService } from "../services/branches";
import { companiesService } from "../../companies/services/companies";

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
    managerId: "",
    managerData: {
      username: "",
      email: "",
      phone: "",
      password: "",
      profile: {
        name: "",
        lastName: "",
      },
    },
    contactPhone: "",
    contactEmail: "",
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersMessage, setManagersMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      console.log("Modal abierto - userCompany:", userCompany);
      loadCompanies();
      loadManagers();
      if (branch) {
        const managerId = (branch.manager && typeof branch.manager !== "string") ? branch.manager._id : "";
        const manager = (branch.manager && typeof branch.manager !== "string") ? branch.manager : null;

        setFormData({
          branchName: branch.branchName,
          branchCode: branch.branchCode || "",
          companyId: typeof branch.companyId === "string" ? branch.companyId : branch.companyId._id,
          address: branch.address,
          managerId: managerId,
          managerData: manager ? {
            username: manager.username,
            email: manager.email,
            phone: manager.phone,
            password: "",
            profile: {
              name: manager.profile.name,
              lastName: manager.profile.lastName,
            },
          } : {
            username: "",
            email: "",
            phone: "",
            password: "",
            profile: {
              name: "",
              lastName: "",
            },
          },
          contactPhone: branch.contactPhone,
          contactEmail: branch.contactEmail,
        });
      } else {
        // Al crear una nueva sucursal, establecer companyId desde userCompany
        resetForm();
        if (userCompany?._id) {
          console.log("Estableciendo companyId:", userCompany._id);
          setFormData(prev => ({
            ...prev,
            companyId: userCompany._id
          }));
        } else {
          console.warn("userCompany no está disponible o no tiene _id");
        }
      }
    }
  }, [show, branch, userCompany]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getAllCompanies({ isActive: true, limit: 1000 });
      setCompanies(response.data || []);
    } catch (err: any) {
      // Silenciar error si no hay empresas, es un caso válido
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      // Obtener gerentes disponibles (sin sucursal asignada)
      const response = await branchesService.getAvailableManagers();
      setManagers(response.data || []);

      // Capturar mensaje si existe
      if (response.message) {
        setManagersMessage(response.message);
      } else if (!response.data || response.data.length === 0) {
        setManagersMessage("No hay gerentes disponibles");
      } else {
        setManagersMessage("");
      }
    } catch (err: any) {
      // Silenciar error si no hay gerentes disponibles, es un caso válido
      setManagers([]);
      setManagersMessage("No se pudieron cargar los gerentes disponibles");
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
      managerId: "",
      managerData: {
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
      },
      contactPhone: "",
      contactEmail: "",
    });
    setError(null);
  };

  // Manejar selección de gerente
  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    if (selectedId === "") {
      // Limpiar selección
      setFormData({
        ...formData,
        managerId: "",
        managerData: {
          username: "",
          email: "",
          phone: "",
          password: "",
          profile: {
            name: "",
            lastName: "",
          },
        },
      });
    } else {
      // Gerente existente seleccionado - rellenar campos
      const manager = managers.find((m) => m._id === selectedId);
      if (manager) {
        setFormData({
          ...formData,
          managerId: selectedId,
          managerData: {
            username: manager.username,
            email: manager.email,
            phone: manager.phone,
            password: "",
            profile: {
              name: manager.profile.name,
              lastName: manager.profile.lastName,
            },
          },
        });
      }
    }
  };

  // Limpiar selección de gerente
  const handleClearManager = () => {
    setFormData({
      ...formData,
      managerId: "",
      managerData: {
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
      },
    });
  };

  // Validar formulario
  const validateForm = (): boolean => {
    // Validar empresa
    if (!formData.companyId || formData.companyId.trim() === "") {
      setError("No se ha seleccionado una empresa. Por favor, verifica que tengas una empresa asignada.");
      return false;
    }

    // Validar datos básicos
    if (!formData.branchName || !formData.contactPhone || !formData.contactEmail) {
      setError("Por favor completa todos los campos requeridos de la sucursal");
      return false;
    }

    // Validar dirección
    if (!formData.address.street || !formData.address.externalNumber ||
        !formData.address.neighborhood || !formData.address.city ||
        !formData.address.state || !formData.address.postalCode) {
      setError("Por favor completa todos los campos de la dirección");
      return false;
    }

    // Validar datos del gerente (SIEMPRE OBLIGATORIO)
    if (!formData.managerData?.username ||
        !formData.managerData?.email ||
        !formData.managerData?.phone ||
        !formData.managerData?.profile?.name ||
        !formData.managerData?.profile?.lastName) {
      setError("Por favor completa todos los campos del gerente");
      return false;
    }

    // Validar contraseña solo si se está creando un nuevo gerente (sin managerId)
    if (!isEditing && !formData.managerId && !formData.managerData?.password) {
      setError("La contraseña es requerida para crear un nuevo gerente");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!validateForm()) {
        setSaving(false);
        return;
      }

      const dataToSend: CreateBranchData = {
        branchName: formData.branchName,
        branchCode: formData.branchCode || undefined,
        companyId: formData.companyId,
        address: formData.address,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
      };

      // Si hay managerId, enviarlo
      if (formData.managerId) {
        dataToSend.managerId = formData.managerId;
      }

      // Si no hay managerId, enviar managerData para crear nuevo gerente
      if (!formData.managerId && formData.managerData) {
        dataToSend.managerData = formData.managerData;
      }

      // Log para debugging
      console.log("Datos a enviar:", dataToSend);

      let response;

      if (isEditing && branch) {
        response = await branchesService.updateBranch(branch._id, dataToSend);
      } else {
        response = await branchesService.createBranch(dataToSend);
      }

      console.log("Respuesta del servidor:", response);

      // Verificar si la operación fue exitosa
      if (!response.success) {
        const errorMsg = response.message || "Error al guardar la sucursal";
        setError(errorMsg);
        toast.error(errorMsg);
        setSaving(false);
        return;
      }

      toast.success(isEditing ? "Sucursal actualizada exitosamente" : "Sucursal creada exitosamente");
      onBranchSaved?.();
      onHide();
    } catch (err: any) {
      console.error("Error completo:", err);
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
                    value={userCompany?.tradeName || userCompany?.legalName || "Cargando..."}
                    disabled
                    readOnly
                  />
                  <Form.Text className="text-muted">
                    {userCompany ? "Empresa asignada a tu usuario" : "Esperando empresa..."}
                  </Form.Text>
                  {!userCompany && (
                    <Form.Text className="text-danger d-block mt-1">
                      No se ha cargado tu empresa. Verifica tu configuración.
                    </Form.Text>
                  )}
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

            {/* Usuario Gerente */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                <h6 className="fw-semibold mb-0">Usuario Gerente <span className="text-danger">*</span></h6>
              </div>
              {formData.managerId && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleClearManager}
                  className="d-flex align-items-center gap-1"
                >
                  <X size={16} />
                  Limpiar
                </Button>
              )}
            </div>
            <Row className="g-3 mb-4">
              {/* Selector de Gerente */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Seleccionar Gerente (Opcional)
                  </Form.Label>
                  <Form.Select
                    value={formData.managerId || ""}
                    onChange={handleManagerChange}
                    className="py-2"
                    disabled={managers.length === 0}
                  >
                    <option value="">
                      {managers.length === 0 && managersMessage
                        ? `-- ${managersMessage} --`
                        : "-- Seleccione un gerente existente o cree uno nuevo --"}
                    </option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.profile.fullName} ({manager.email})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className={managersMessage && managers.length === 0 ? "text-warning" : "text-muted"}>
                    {managersMessage && managers.length === 0
                      ? managersMessage
                      : formData.managerId
                      ? "Gerente seleccionado. Puede editar sus datos abajo."
                      : "Puede seleccionar un gerente existente o crear uno nuevo llenando los campos."}
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Campos del Gerente - Siempre habilitados */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre de Usuario <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el nombre de usuario"
                    value={formData.managerData?.username || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managerData: formData.managerData
                          ? {
                              ...formData.managerData,
                              username: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Ingresa el email"
                    value={formData.managerData?.email || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managerData: formData.managerData
                          ? {
                              ...formData.managerData,
                              email: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Teléfono <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Ingresa el teléfono"
                    value={formData.managerData?.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managerData: formData.managerData
                          ? {
                              ...formData.managerData,
                              phone: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el nombre"
                    value={formData.managerData?.profile.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managerData: formData.managerData
                          ? {
                              ...formData.managerData,
                              profile: {
                                ...formData.managerData.profile,
                                name: e.target.value,
                              },
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Apellido <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el apellido"
                    value={formData.managerData?.profile.lastName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managerData: formData.managerData
                          ? {
                              ...formData.managerData,
                              profile: {
                                ...formData.managerData.profile,
                                lastName: e.target.value,
                              },
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Contraseña {!formData.managerId && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder={
                      formData.managerId
                        ? "●●●●●●●● (Sin cambios)"
                        : "Ingresa la contraseña"
                    }
                    value={formData.managerData?.password || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managerData: formData.managerData
                          ? {
                              ...formData.managerData,
                              password: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    {formData.managerId
                      ? "Dejar en blanco para mantener la contraseña actual"
                      : "Requerida para crear nuevo gerente"}
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Rol - Siempre Gerente por defecto */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Rol</Form.Label>
                  <Form.Control
                    type="text"
                    value="Gerente"
                    disabled
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Los usuarios de sucursales siempre tienen rol Gerente
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
          disabled={saving || loading || !formData.companyId}
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
