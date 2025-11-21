import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { Users, X } from "lucide-react";
import { toast } from "react-toastify";
import { companiesService } from "../services/companies";
import { Company, RedesUser } from "../types";

interface AssignRedesModalProps {
  show: boolean;
  onHide: () => void;
  company: Company;
  onRedesUpdated?: () => void;
}

interface RedesUserFormData {
  redesId: string;
  redesData?: {
    username: string;
    email: string;
    phone: string;
    password: string;
    profile: {
      name: string;
      lastName: string;
    };
  };
}

const AssignRedesModal: React.FC<AssignRedesModalProps> = ({
  show,
  onHide,
  company,
  onRedesUpdated,
}) => {
  const [redesUsers, setRedesUsers] = useState<RedesUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState<RedesUserFormData>({
    redesId: "",
    redesData: {
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

  // Cargar usuarios redes cuando se abre el modal
  useEffect(() => {
    if (show) {
      loadRedesUsers();
      // Cargar el usuario redes actual de la empresa (si existe)
      if (company.redes && company.redes.length > 0) {
        const redesUser = company.redes[0];
        setFormData({
          redesId: redesUser._id,
          redesData: {
            username: redesUser.username,
            email: redesUser.email,
            phone: redesUser.phone,
            password: "",
            profile: {
              name: redesUser.profile.name,
              lastName: redesUser.profile.lastName,
            },
          },
        });
      } else {
        setFormData({
          redesId: "",
          redesData: {
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
      }
    }
  }, [show, company]);

  const loadRedesUsers = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getRedesUsers();
      setRedesUsers(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar usuarios redes:", error);
      toast.error(error.message || "Error al cargar usuarios redes");
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de usuario redes
  const handleRedesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    if (selectedId === "") {
      // Limpiar selección
      setFormData({
        redesId: "",
        redesData: {
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
      // Usuario redes existente seleccionado - rellenar campos
      const redesUser = redesUsers.find((r) => r._id === selectedId);
      if (redesUser) {
        setFormData({
          redesId: selectedId,
          redesData: {
            username: redesUser.username,
            email: redesUser.email,
            phone: redesUser.phone,
            password: "",
            profile: {
              name: redesUser.profile.name,
              lastName: redesUser.profile.lastName,
            },
          },
        });
      }
    }
  };

  // Limpiar selección de usuario redes
  const handleClearRedes = () => {
    setFormData({
      redesId: "",
      redesData: {
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
    // Validar datos del usuario redes
    if (
      !formData.redesData?.username ||
      !formData.redesData?.email ||
      !formData.redesData?.phone ||
      !formData.redesData?.profile?.name ||
      !formData.redesData?.profile?.lastName
    ) {
      toast.error("Por favor completa todos los campos del usuario redes");
      return false;
    }

    // Validar contraseña solo si se está creando un nuevo usuario (sin redesId)
    if (!formData.redesId && !formData.redesData?.password) {
      toast.error("La contraseña es requerida para crear un nuevo usuario");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const dataToSend: any = {
        ...company,
      };

      // Si hay redesId, enviarlo
      if (formData.redesId) {
        dataToSend.redesIds = [formData.redesId];
      }

      // Si no hay redesId, enviar redesData para crear nuevo usuario
      if (!formData.redesId && formData.redesData) {
        dataToSend.redesUserData = formData.redesData;
      }

      await companiesService.updateCompany(company._id, dataToSend);

      toast.success(
        formData.redesId
          ? "Usuario redes asignado exitosamente"
          : "Usuario redes creado y asignado exitosamente"
      );

      onRedesUpdated?.();
      onHide();
    } catch (error: any) {
      console.error("Error al asignar usuario redes:", error);
      toast.error(error.message || "Error al asignar usuario redes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <Users size={24} className="text-primary" />
          <div>
            <h5 className="mb-0">Asignar Usuario Redes</h5>
            <small className="text-muted fw-normal">
              {company.legalName}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-3">Cargando...</p>
          </div>
        ) : (
          <Row className="g-3">
            {/* Selector de Usuario Redes */}
            <Col md={12}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Form.Label className="fw-semibold mb-0">
                  Seleccionar Usuario Redes (Opcional)
                </Form.Label>
                {formData.redesId && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleClearRedes}
                    className="d-flex align-items-center gap-1"
                  >
                    <X size={16} />
                    Limpiar
                  </Button>
                )}
              </div>
              <Form.Select
                value={formData.redesId || ""}
                onChange={handleRedesChange}
                className="py-2"
              >
                <option value="">
                  -- Seleccione un usuario redes existente o cree uno nuevo --
                </option>
                {redesUsers.map((redesUser) => (
                  <option key={redesUser._id} value={redesUser._id}>
                    {redesUser.profile.fullName} ({redesUser.email})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {formData.redesId
                  ? "Usuario redes seleccionado. Puede editar sus datos abajo."
                  : "Puede seleccionar un usuario redes existente o crear uno nuevo llenando los campos."}
              </Form.Text>
            </Col>

            {/* Campos del Usuario Redes - Siempre habilitados */}
            {/* Nombre */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Nombre</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={formData.redesData?.profile.name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redesData: formData.redesData
                        ? {
                            ...formData.redesData,
                            profile: {
                              ...formData.redesData.profile,
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

            {/* Apellido */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Apellido</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el apellido"
                  value={formData.redesData?.profile.lastName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redesData: formData.redesData
                        ? {
                            ...formData.redesData,
                            profile: {
                              ...formData.redesData.profile,
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

            {/* Teléfono */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Teléfono</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Ingresa el teléfono"
                  value={formData.redesData?.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redesData: formData.redesData
                        ? {
                            ...formData.redesData,
                            phone: e.target.value,
                          }
                        : undefined,
                    })
                  }
                  className="py-2"
                />
              </Form.Group>
            </Col>

            {/* Email */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Ingresa el email"
                  value={formData.redesData?.email || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redesData: formData.redesData
                        ? {
                            ...formData.redesData,
                            email: e.target.value,
                          }
                        : undefined,
                    })
                  }
                  className="py-2"
                />
              </Form.Group>
            </Col>

            {/* Nombre de Usuario */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Nombre de Usuario
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el nombre de usuario"
                  value={formData.redesData?.username || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redesData: formData.redesData
                        ? {
                            ...formData.redesData,
                            username: e.target.value,
                          }
                        : undefined,
                    })
                  }
                  className="py-2"
                />
              </Form.Group>
            </Col>

            {/* Rol - Siempre Redes por defecto */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Rol</Form.Label>
                <Form.Control
                  type="text"
                  value="Redes"
                  disabled
                  className="py-2"
                />
                <Form.Text className="text-muted">
                  Los usuarios redes siempre tienen rol Redes
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Contraseña */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={
                    formData.redesId
                      ? "●●●●●●●● (Sin cambios)"
                      : "Ingresa la contraseña"
                  }
                  value={formData.redesData?.password || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      redesData: formData.redesData
                        ? {
                            ...formData.redesData,
                            password: e.target.value,
                          }
                        : undefined,
                    })
                  }
                  className="py-2"
                />
                <Form.Text className="text-muted">
                  {formData.redesId
                    ? "Dejar en blanco para mantener la contraseña actual"
                    : "Requerida para crear nuevo usuario"}
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Confirmar Contraseña */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Confirmar Contraseña
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder={
                    formData.redesId
                      ? "●●●●●●●● (Sin cambios)"
                      : "Confirma la contraseña"
                  }
                  className="py-2"
                />
                <Form.Text className="text-muted">
                  {formData.redesId && "Solo si desea cambiar la contraseña"}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="light" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading || saving}
          className="px-4"
        >
          {saving ? (
            <>
              <Spinner
                animation="border"
                size="sm"
                className="me-2"
                style={{ width: "16px", height: "16px" }}
              />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignRedesModal;
