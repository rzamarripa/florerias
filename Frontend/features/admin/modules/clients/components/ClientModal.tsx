import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { X, Save, User, QrCode, Download } from "lucide-react";
import { Client, CreateClientData, UpdateClientData } from "../types";
import { useRouter } from "next/navigation";
import digitalCardService from "../../digitalCards/services/digitalCardService";
import { toast } from "react-toastify";

interface ClientModalProps {
  show: boolean;
  onHide: () => void;
  client?: Client | null;
  onSave: (data: CreateClientData | UpdateClientData) => void;
  loading?: boolean;
}

const ClientModal: React.FC<ClientModalProps> = ({
  show,
  onHide,
  client,
  onSave,
  loading = false,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateClientData>({
    name: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    points: 0,
    status: true,
    branch: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatingCard, setGeneratingCard] = useState(false);
  const [digitalCard, setDigitalCard] = useState<any>(null);
  const [showCardActions, setShowCardActions] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        lastName: client.lastName,
        phoneNumber: client.phoneNumber,
        email: client.email || "",
        points: client.points,
        status: client.status,
        branch: client.branch?._id || "",
      });
      // Cargar tarjeta digital si existe
      if (client._id) {
        checkDigitalCard(client._id);
      }
    } else {
      setFormData({
        name: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        points: 0,
        status: true,
        branch: "",
      });
      setDigitalCard(null);
      setShowCardActions(false);
    }
    setErrors({});
  }, [client, show]);

  const handleChange = (field: keyof CreateClientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "El teléfono es requerido";
    }
    if (formData.points !== undefined && formData.points < 0) {
      newErrors.points = "Los puntos no pueden ser negativos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const isEditing = !!client;

  const checkDigitalCard = async (clientId: string) => {
    try {
      const card = await digitalCardService.getDigitalCard(clientId);
      if (card) {
        setDigitalCard(card);
        setShowCardActions(true);
      }
    } catch (error) {
      console.log("No hay tarjeta digital para este cliente");
    }
  };

  const handleGenerateCard = async () => {
    if (!client?._id) return;
    
    try {
      setGeneratingCard(true);
      let card = digitalCard;
      
      if (!card) {
        card = await digitalCardService.generateDigitalCard(client._id);
        toast.success("Tarjeta digital generada exitosamente");
      }
      
      setDigitalCard(card);
      setShowCardActions(true);
    } catch (error) {
      console.error("Error generando tarjeta:", error);
      toast.error("Error al generar la tarjeta digital");
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleDownloadQR = () => {
    if (digitalCard?.qrCode) {
      digitalCardService.downloadQRImage(
        digitalCard.qrCode, 
        `qr-${client?.clientNumber || 'cliente'}.png`
      );
      toast.success("Código QR descargado");
    }
  };

  const handleViewFullCard = () => {
    if (client?._id) {
      router.push(`/admin/digital-cards?clientId=${client._id}`);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-bottom-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <User size={20} className="text-primary" />
          {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
        </Modal.Title>
        <Button
          variant="link"
          onClick={onHide}
          className="text-muted p-0"
          style={{ border: "none", background: "none" }}
        >
          <X size={20} />
        </Button>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Nombre <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Apellido <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el apellido"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  isInvalid={!!errors.lastName}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.lastName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Teléfono <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  isInvalid={!!errors.phoneNumber}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phoneNumber}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Puntos Iniciales</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.points}
                  onChange={(e) => handleChange("points", parseInt(e.target.value) || 0)}
                  isInvalid={!!errors.points}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.points}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Cliente Activo"
                  checked={formData.status}
                  onChange={(e) => handleChange("status", e.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-top-0 pt-0">
        <div className="d-flex justify-content-between w-100">
          <div>
            {isEditing && (
              <div className="d-flex gap-2">
                {!digitalCard ? (
                  <Button
                    variant="outline-primary"
                    onClick={handleGenerateCard}
                    disabled={generatingCard}
                    className="d-flex align-items-center gap-2"
                  >
                    {generatingCard ? (
                      <>
                        <Spinner size="sm" animation="border" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <QrCode size={16} />
                        Generar Tarjeta
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline-success"
                      onClick={handleDownloadQR}
                      className="d-flex align-items-center gap-2"
                    >
                      <Download size={16} />
                      Descargar QR
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={handleViewFullCard}
                      className="d-flex align-items-center gap-2"
                    >
                      <QrCode size={16} />
                      Ver Tarjeta
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
              className="d-flex align-items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm" role="status" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? "Actualizar" : "Crear"} Cliente
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ClientModal;