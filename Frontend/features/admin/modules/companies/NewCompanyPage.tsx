"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import {
  Building2,
  Save,
  ArrowLeft,
  User,
  MapPin,
  FileText,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { companiesService } from "./services/companies";
import { CreateCompanyData, Distributor } from "./types";
import { legalForms } from "./schemas/companySchema";

const NewCompanyPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  const isEditing = !!companyId;

  const [formData, setFormData] = useState<CreateCompanyData>({
    legalName: "",
    tradeName: "",
    rfc: "",
    legalForm: "S.A. de C.V.",
    fiscalAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
    },
    primaryContact: {
      name: "",
      email: "",
      phone: "",
    },
    distributorId: "",
    distributorData: {
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

  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar distribuidores
  useEffect(() => {
    loadDistributors();
  }, []);

  // Cargar empresa si estamos editando
  useEffect(() => {
    if (isEditing) {
      loadCompany();
    }
  }, [companyId]);

  const loadDistributors = async () => {
    try {
      const response = await companiesService.getDistributors();
      setDistributors(response.data || []);
    } catch (err: any) {
      console.error("Error al cargar distribuidores:", err);
    }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getCompanyById(companyId);
      const company = response.data;

      const distributorId = company.distributor?._id || "";

      setFormData({
        legalName: company.legalName,
        tradeName: company.tradeName || "",
        rfc: company.rfc,
        legalForm: company.legalForm,
        fiscalAddress: company.fiscalAddress,
        primaryContact: company.primaryContact,
        distributorId: distributorId,
        distributorData: company.distributor ? {
          username: company.distributor.username,
          email: company.distributor.email,
          phone: company.distributor.phone,
          password: "",
          profile: {
            name: company.distributor.profile.name,
            lastName: company.distributor.profile.lastName,
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
      });
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la empresa");
      router.push("/gestion/empresas");
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de distribuidor
  const handleDistributorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    if (selectedId === "") {
      // Limpiar selección
      setFormData({
        ...formData,
        distributorId: "",
        distributorData: {
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
      // Distribuidor existente seleccionado - rellenar campos
      const distributor = distributors.find((d) => d._id === selectedId);
      if (distributor) {
        setFormData({
          ...formData,
          distributorId: selectedId,
          distributorData: {
            username: distributor.username,
            email: distributor.email,
            phone: distributor.phone,
            password: "",
            profile: {
              name: distributor.profile.name,
              lastName: distributor.profile.lastName,
            },
          },
        });
      }
    }
  };

  // Limpiar selección de distribuidor
  const handleClearDistributor = () => {
    setFormData({
      ...formData,
      distributorId: "",
      distributorData: {
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
    // Validar datos de empresa
    if (!formData.legalName || !formData.rfc || !formData.legalForm) {
      setError("Por favor completa todos los campos requeridos de la empresa");
      return false;
    }

    if (!formData.fiscalAddress.street || !formData.fiscalAddress.city ||
        !formData.fiscalAddress.state || !formData.fiscalAddress.postalCode) {
      setError("Por favor completa todos los campos de la dirección fiscal");
      return false;
    }

    if (!formData.primaryContact.name || !formData.primaryContact.email ||
        !formData.primaryContact.phone) {
      setError("Por favor completa todos los campos del contacto principal");
      return false;
    }

    // Validar distribuidor
    if (!formData.distributorId) {
      setError("Debe seleccionar un distribuidor");
      return false;
    }

    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const dataToSend: CreateCompanyData = {
        legalName: formData.legalName,
        tradeName: formData.tradeName || undefined,
        rfc: formData.rfc.toUpperCase(),
        legalForm: formData.legalForm,
        fiscalAddress: formData.fiscalAddress,
        primaryContact: formData.primaryContact,
        distributorId: formData.distributorId,
      };

      if (isEditing) {
        await companiesService.updateCompany(companyId, dataToSend);
        toast.success("Empresa actualizada exitosamente");
      } else {
        await companiesService.createCompany(dataToSend);
        toast.success("Empresa creada exitosamente");
      }

      router.push("/gestion/empresas");
    } catch (err: any) {
      setError(err.message || "Error al guardar la empresa");
      toast.error(err.message || "Error al guardar la empresa");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="new-company-page">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Información de la Empresa */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Building2 size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Datos de la Empresa</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {/* Razón Social */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Razón Social <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Razón social de la empresa"
                    value={formData.legalName}
                    onChange={(e) =>
                      setFormData({ ...formData, legalName: e.target.value })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Nombre Comercial */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre Comercial
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre comercial (opcional)"
                    value={formData.tradeName}
                    onChange={(e) =>
                      setFormData({ ...formData, tradeName: e.target.value })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* RFC */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    RFC <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="RFC de la empresa"
                    value={formData.rfc}
                    onChange={(e) =>
                      setFormData({ ...formData, rfc: e.target.value.toUpperCase() })
                    }
                    required
                    maxLength={13}
                    className="py-2"
                    style={{ textTransform: "uppercase" }}
                  />
                  <Form.Text className="text-muted">
                    Formato: ABC123456XYZ (12-13 caracteres)
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Forma Legal */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Forma Legal <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.legalForm}
                    onChange={(e) =>
                      setFormData({ ...formData, legalForm: e.target.value })
                    }
                    required
                    className="py-2"
                  >
                    {legalForms.map((form) => (
                      <option key={form} value={form}>
                        {form}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Dirección Fiscal */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <MapPin size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Dirección Fiscal</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {/* Calle */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Calle <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Calle y número"
                    value={formData.fiscalAddress.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fiscalAddress: {
                          ...formData.fiscalAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Ciudad */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Ciudad <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ciudad"
                    value={formData.fiscalAddress.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fiscalAddress: {
                          ...formData.fiscalAddress,
                          city: e.target.value,
                        },
                      })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Estado */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Estado <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Estado"
                    value={formData.fiscalAddress.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fiscalAddress: {
                          ...formData.fiscalAddress,
                          state: e.target.value,
                        },
                      })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Código Postal */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Código Postal <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="00000"
                    value={formData.fiscalAddress.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fiscalAddress: {
                          ...formData.fiscalAddress,
                          postalCode: e.target.value,
                        },
                      })
                    }
                    required
                    maxLength={5}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Contacto Principal */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <User size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Contacto Principal</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {/* Nombre del Contacto */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre del contacto"
                    value={formData.primaryContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryContact: {
                          ...formData.primaryContact,
                          name: e.target.value,
                        },
                      })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Email del Contacto */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={formData.primaryContact.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryContact: {
                          ...formData.primaryContact,
                          email: e.target.value,
                        },
                      })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Teléfono del Contacto */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Teléfono <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="1234567890"
                    value={formData.primaryContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryContact: {
                          ...formData.primaryContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Usuario Distribuidor */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Usuario Distribuidor</h5>
              </div>
              {formData.distributorId && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleClearDistributor}
                  className="d-flex align-items-center gap-1"
                >
                  <X size={16} />
                  Limpiar
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {/* Selector de Distribuidor */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Seleccionar Distribuidor <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.distributorId || ""}
                    onChange={handleDistributorChange}
                    required
                    className="py-2"
                  >
                    <option value="">-- Seleccione un distribuidor --</option>
                    {distributors.map((dist) => (
                      <option key={dist._id} value={dist._id}>
                        {dist.profile.fullName} ({dist.email})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {formData.distributorId
                      ? "Distribuidor seleccionado"
                      : "Seleccione un distribuidor existente"}
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Campos del Distribuidor - Siempre visibles y habilitados */}
              {/* Username */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre de usuario"
                    value={formData.distributorData?.username || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distributorData: formData.distributorData
                          ? {
                              ...formData.distributorData,
                              username: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    disabled
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
                    placeholder="email@ejemplo.com"
                    value={formData.distributorData?.email || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distributorData: formData.distributorData
                          ? {
                              ...formData.distributorData,
                              email: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    disabled
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
                    placeholder="1234567890"
                    value={formData.distributorData?.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distributorData: formData.distributorData
                          ? {
                              ...formData.distributorData,
                              phone: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    disabled
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Nombre */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre"
                    value={formData.distributorData?.profile.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distributorData: formData.distributorData
                          ? {
                              ...formData.distributorData,
                              profile: {
                                ...formData.distributorData.profile,
                                name: e.target.value,
                              },
                            }
                          : undefined,
                      })
                    }
                    disabled
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
                    placeholder="Apellido"
                    value={formData.distributorData?.profile.lastName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distributorData: formData.distributorData
                          ? {
                              ...formData.distributorData,
                              profile: {
                                ...formData.distributorData.profile,
                                lastName: e.target.value,
                              },
                            }
                          : undefined,
                      })
                    }
                    disabled
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Botones */}
        <div className="d-flex justify-content-between gap-2 mb-4">
          <Button
            type="button"
            variant="outline-secondary"
            size="lg"
            onClick={() => router.back()}
            className="d-flex align-items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="d-flex align-items-center gap-2 px-5"
          >
            <Save size={18} />
            {loading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default NewCompanyPage;
