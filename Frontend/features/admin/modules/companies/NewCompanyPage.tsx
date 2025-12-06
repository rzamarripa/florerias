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
  Upload,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { companiesService } from "./services/companies";
import { CreateCompanyData, Distributor } from "./types";
import { legalForms } from "./schemas/companySchema";
import { uploadCompanyLogo } from "@/services/firebaseStorage";

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
    administratorId: "",
    administratorData: {
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
      const response = await companiesService.getAdministrators();
      setDistributors(response.data || []);
    } catch (err: any) {
      console.error("Error al cargar administradores:", err);
    }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getCompanyById(companyId);
      const company = response.data;

      const administratorId = company.administrator?._id || "";

      setFormData({
        legalName: company.legalName,
        tradeName: company.tradeName || "",
        rfc: company.rfc,
        legalForm: company.legalForm,
        fiscalAddress: company.fiscalAddress,
        primaryContact: company.primaryContact,
        administratorId: administratorId,
        administratorData: company.administrator
          ? {
              username: company.administrator.username,
              email: company.administrator.email,
              phone: company.administrator.phone,
              password: "",
              profile: {
                name: company.administrator.profile.name,
                lastName: company.administrator.profile.lastName,
              },
            }
          : {
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
        administratorId: "",
        administratorData: {
          username: "",
          email: "",
          phone: "",
          password: "",
          profile: {
            name: "",
            lastName: "",
          },
        },
        primaryContact: {
          name: "",
          email: "",
          phone: "",
        },
      });
    } else {
      // Distribuidor existente seleccionado - rellenar campos
      const distributor = distributors.find((d) => d._id === selectedId);
      if (distributor) {
        setFormData({
          ...formData,
          administratorId: selectedId,
          administratorData: {
            username: distributor.username,
            email: distributor.email,
            phone: distributor.phone,
            password: "",
            profile: {
              name: distributor.profile.name,
              lastName: distributor.profile.lastName,
            },
          },
          primaryContact: {
            name: distributor.profile.fullName,
            email: distributor.email,
            phone: distributor.phone,
          },
        });
      }
    }
  };

  // Limpiar selección de distribuidor
  const handleClearDistributor = () => {
    setFormData({
      ...formData,
      administratorId: "",
      administratorData: {
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
      },
      primaryContact: {
        name: "",
        email: "",
        phone: "",
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

    if (
      !formData.fiscalAddress.street ||
      !formData.fiscalAddress.city ||
      !formData.fiscalAddress.state ||
      !formData.fiscalAddress.postalCode
    ) {
      setError("Por favor completa todos los campos de la dirección fiscal");
      return false;
    }

    if (
      !formData.primaryContact.name ||
      !formData.primaryContact.email ||
      !formData.primaryContact.phone
    ) {
      setError("Por favor completa todos los campos del contacto principal");
      return false;
    }

    // Validar datos del usuario administrador
    if (
      !formData.administratorData?.username ||
      !formData.administratorData?.email ||
      !formData.administratorData?.phone ||
      !formData.administratorData?.profile?.name ||
      !formData.administratorData?.profile?.lastName
    ) {
      setError("Por favor completa todos los campos del usuario administrador");
      return false;
    }

    // Validar contraseña solo si se está creando un nuevo usuario (sin administratorId)
    if (
      !isEditing &&
      !formData.administratorId &&
      !formData.administratorData?.password
    ) {
      setError("La contraseña es requerida para crear un nuevo usuario");
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
      };

      // Si hay administratorId, enviarlo
      if (formData.administratorId) {
        dataToSend.administratorId = formData.administratorId;
      }

      // Si no hay administratorId, enviar administratorData para crear nuevo usuario
      if (!formData.administratorId && formData.administratorData) {
        dataToSend.administratorData = formData.administratorData;
      }

      let response;

      if (isEditing) {
        response = await companiesService.updateCompany(companyId, dataToSend);
      } else {
        response = await companiesService.createCompany(dataToSend);
      }

      // Verificar si la operación fue exitosa
      if (!response.success) {
        // Si es error de permisos, el toast ya se mostró desde el interceptor
        if ((response as any).permissionDenied) {
          return;
        }
        // Para otros errores, mostrar mensaje
        throw new Error(response.message || "Error al guardar la empresa");
      }

      // Subir logo a Firebase Storage DESPUÉS de crear/actualizar la empresa
      let logoUrl: string | null = null;
      let logoPath: string | null = null;

      if (logoFile) {
        setUploadingLogo(true);
        toast.info("Subiendo logo a Firebase Storage...");

        try {
          const savedCompanyId = response.data._id;

          // Subir logo
          const logoResult = await uploadCompanyLogo(logoFile, savedCompanyId);
          logoUrl = logoResult.url;
          logoPath = logoResult.path;

          // Actualizar la empresa con las URLs del logo
          await companiesService.updateCompany(savedCompanyId, {
            logoUrl,
            logoPath,
          });

          toast.success("Logo subido exitosamente");
        } catch (uploadError: any) {
          console.error("Error al subir logo:", uploadError);
          toast.warning("Empresa guardada pero hubo un error al subir el logo. Puedes intentar subirlo después.");
        } finally {
          setUploadingLogo(false);
        }
      }

      // Mostrar toast de éxito
      toast.success(
        isEditing
          ? "Empresa actualizada exitosamente"
          : "Empresa creada exitosamente"
      );
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
                      setFormData({
                        ...formData,
                        rfc: e.target.value.toUpperCase(),
                      })
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

              {/* Logo de la Empresa */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Upload size={16} className="me-2" />
                    Logo de la Empresa
                  </Form.Label>
                  <Form.Control
                    type="file"
                    className="py-2"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                      }
                    }}
                  />
                  {logoFile && (
                    <Form.Text className="text-success">
                      ✓ Archivo seleccionado: {logoFile.name}
                    </Form.Text>
                  )}
                  <Form.Text className="text-muted d-block">
                    Formatos aceptados: JPG, PNG, SVG. Tamaño recomendado: 500x500px
                  </Form.Text>
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

        {/* Usuario Administrador */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                <h5 className="mb-0 fw-bold">Usuario Administrador</h5>
              </div>
              {formData.administratorId && (
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
                    Seleccionar Administrador (Opcional)
                  </Form.Label>
                  <Form.Select
                    value={formData.administratorId || ""}
                    onChange={handleDistributorChange}
                    className="py-2"
                  >
                    <option value="">
                      -- Seleccione un administrador existente o cree uno nuevo
                      --
                    </option>
                    {distributors.map((dist) => (
                      <option key={dist._id} value={dist._id}>
                        {dist.profile.fullName} ({dist.email})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {formData.administratorId
                      ? "Administrador seleccionado. Puede editar sus datos abajo."
                      : "Puede seleccionar un administrador existente o crear uno nuevo llenando los campos."}
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Campos del Administrador - Siempre habilitados */}
              {/* Nombre */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el nombre"
                    value={formData.administratorData?.profile.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        administratorData: formData.administratorData
                          ? {
                              ...formData.administratorData,
                              profile: {
                                ...formData.administratorData.profile,
                                name: e.target.value,
                              },
                            }
                          : undefined,
                        primaryContact: {
                          ...formData.primaryContact,
                          name: `${e.target.value} ${
                            formData.administratorData?.profile.lastName || ""
                          }`.trim(),
                        },
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
                    value={formData.administratorData?.profile.lastName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        administratorData: formData.administratorData
                          ? {
                              ...formData.administratorData,
                              profile: {
                                ...formData.administratorData.profile,
                                lastName: e.target.value,
                              },
                            }
                          : undefined,
                        primaryContact: {
                          ...formData.primaryContact,
                          name: `${
                            formData.administratorData?.profile.name || ""
                          } ${e.target.value}`.trim(),
                        },
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
                    value={formData.administratorData?.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        administratorData: formData.administratorData
                          ? {
                              ...formData.administratorData,
                              phone: e.target.value,
                            }
                          : undefined,
                        primaryContact: {
                          ...formData.primaryContact,
                          phone: e.target.value,
                        },
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
                    value={formData.administratorData?.email || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        administratorData: formData.administratorData
                          ? {
                              ...formData.administratorData,
                              email: e.target.value,
                            }
                          : undefined,
                        primaryContact: {
                          ...formData.primaryContact,
                          email: e.target.value,
                        },
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
                    value={formData.administratorData?.username || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        administratorData: formData.administratorData
                          ? {
                              ...formData.administratorData,
                              username: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* Rol - Siempre Administrador por defecto */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Rol</Form.Label>
                  <Form.Control
                    type="text"
                    value="Administrador"
                    disabled
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Los usuarios de empresas siempre tienen rol Administrador
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
                      formData.administratorId
                        ? "●●●●●●●● (Sin cambios)"
                        : "Ingresa la contraseña"
                    }
                    value={formData.administratorData?.password || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        administratorData: formData.administratorData
                          ? {
                              ...formData.administratorData,
                              password: e.target.value,
                            }
                          : undefined,
                      })
                    }
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    {formData.administratorId
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
                      formData.administratorId
                        ? "●●●●●●●● (Sin cambios)"
                        : "Confirma la contraseña"
                    }
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    {formData.administratorId &&
                      "Solo si desea cambiar la contraseña"}
                  </Form.Text>
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
                  <Form.Text className="text-muted">
                    Se rellena automáticamente con los datos del usuario
                    administrador
                  </Form.Text>
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
            disabled={loading || uploadingLogo}
            className="d-flex align-items-center gap-2 px-5"
          >
            <Save size={18} />
            {uploadingLogo ? "Subiendo logo..." : loading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default NewCompanyPage;
