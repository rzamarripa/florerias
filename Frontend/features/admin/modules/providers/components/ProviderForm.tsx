"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { providerSchema, ProviderFormData } from "../schemas/providerSchema";
import { providersService } from "../services/providers";
import { companiesService } from "../../companies/services/companies";
import { Provider } from "../types";

interface ProviderFormProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  provider?: Provider | null;
}

const ProviderForm: React.FC<ProviderFormProps> = ({
  show,
  onHide,
  onSuccess,
  provider,
}) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      contactName: "",
      tradeName: "",
      legalName: "",
      rfc: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
      },
      email: "",
      company: "",
    },
  });

  useEffect(() => {
    if (show) {
      loadCompanies();
      if (provider) {
        reset({
          contactName: provider.contactName,
          tradeName: provider.tradeName,
          legalName: provider.legalName,
          rfc: provider.rfc,
          phone: provider.phone,
          address: provider.address,
          email: provider.email,
          company: provider.company._id,
        });
      } else {
        reset({
          contactName: "",
          tradeName: "",
          legalName: "",
          rfc: "",
          phone: "",
          address: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
          },
          email: "",
          company: "",
        });
      }
    }
  }, [show, provider, reset]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companiesService.getAllCompanies({
        page: 1,
        limit: 1000,
        isActive: true,
      });
      if (response.data) {
        setCompanies(response.data);
      }
    } catch (error: any) {
      toast.error("Error al cargar las empresas");
      console.error("Error loading companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const onSubmit = async (data: ProviderFormData) => {
    try {
      setLoading(true);

      if (provider) {
        await providersService.updateProvider(provider._id, data);
        toast.success("Proveedor actualizado exitosamente");
      } else {
        await providersService.createProvider(data);
        toast.success("Proveedor creado exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el proveedor");
      console.error("Error saving provider:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div>
          <Modal.Title className="fw-bold">
            {provider ? "Editar Proveedor" : "Nuevo Proveedor"}
          </Modal.Title>
          <p className="text-muted mb-0 small">
            {provider
              ? "Actualiza la información del proveedor"
              : "Completa los datos del nuevo proveedor"}
          </p>
        </div>
        <Button
          variant="link"
          onClick={onHide}
          className="text-muted p-0"
          style={{ fontSize: "1.5rem" }}
        >
          <X size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="pt-3">
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="g-3">
            {/* Empresa */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Empresa <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors.company}
                      disabled={loadingCompanies || !!provider}
                      style={{ borderRadius: "8px" }}
                    >
                      <option value="">Selecciona una empresa</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.legalName} - {company.rfc}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                {errors.company && (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {errors.company.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Nombre de Contacto */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Nombre de Contacto <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="contactName"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Juan Pérez"
                      isInvalid={!!errors.contactName}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.contactName && (
                  <Form.Control.Feedback type="invalid">
                    {errors.contactName.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Teléfono */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Teléfono <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="5512345678"
                      isInvalid={!!errors.phone}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.phone && (
                  <Form.Control.Feedback type="invalid">
                    {errors.phone.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Nombre Comercial */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Nombre Comercial <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="tradeName"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Mi Empresa S.A."
                      isInvalid={!!errors.tradeName}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.tradeName && (
                  <Form.Control.Feedback type="invalid">
                    {errors.tradeName.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Nombre Fiscal */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Nombre Fiscal <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="legalName"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Mi Empresa S.A. de C.V."
                      isInvalid={!!errors.legalName}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.legalName && (
                  <Form.Control.Feedback type="invalid">
                    {errors.legalName.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* RFC */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  RFC <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="rfc"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="ABC123456XYZ"
                      maxLength={13}
                      isInvalid={!!errors.rfc}
                      style={{ borderRadius: "8px", textTransform: "uppercase" }}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                {errors.rfc && (
                  <Form.Control.Feedback type="invalid">
                    {errors.rfc.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Email */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Email <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="email"
                      placeholder="contacto@ejemplo.com"
                      isInvalid={!!errors.email}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.email && (
                  <Form.Control.Feedback type="invalid">
                    {errors.email.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Dirección Section */}
            <Col md={12}>
              <hr className="my-3" />
              <h6 className="fw-bold mb-3">Dirección</h6>
            </Col>

            {/* Calle */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Calle <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="address.street"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Av. Principal #123"
                      isInvalid={!!errors.address?.street}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.address?.street && (
                  <Form.Control.Feedback type="invalid">
                    {errors.address.street.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Ciudad */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Ciudad <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="address.city"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ciudad de México"
                      isInvalid={!!errors.address?.city}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.address?.city && (
                  <Form.Control.Feedback type="invalid">
                    {errors.address.city.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Estado */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Estado <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="address.state"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="CDMX"
                      isInvalid={!!errors.address?.state}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.address?.state && (
                  <Form.Control.Feedback type="invalid">
                    {errors.address.state.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Código Postal */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Código Postal <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="address.postalCode"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="01234"
                      maxLength={5}
                      isInvalid={!!errors.address?.postalCode}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.address?.postalCode && (
                  <Form.Control.Feedback type="invalid">
                    {errors.address.postalCode.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              variant="light"
              onClick={onHide}
              disabled={loading}
              style={{ borderRadius: "8px" }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
              }}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Guardando...
                </>
              ) : provider ? (
                "Actualizar Proveedor"
              ) : (
                "Crear Proveedor"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ProviderForm;
