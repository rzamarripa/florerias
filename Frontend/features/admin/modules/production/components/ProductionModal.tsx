import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { X, Save, User, Eye, EyeOff } from "lucide-react";
import { Production, CreateProductionData, UpdateProductionData } from "../types";

interface ProductionModalProps {
  show: boolean;
  onHide: () => void;
  production?: Production | null;
  onSave: (data: CreateProductionData | UpdateProductionData) => void;
  loading?: boolean;
}

const ProductionModal: React.FC<ProductionModalProps> = ({
  show,
  onHide,
  production,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateProductionData>({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    direccion: "",
    telefono: "",
    correo: "",
    usuario: "",
    contrasena: "",
    foto: "",
    estatus: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (production) {
      setFormData({
        nombre: production.nombre,
        apellidoPaterno: production.apellidoPaterno,
        apellidoMaterno: production.apellidoMaterno,
        direccion: production.direccion,
        telefono: production.telefono,
        correo: production.correo,
        usuario: production.usuario,
        contrasena: "",
        foto: production.foto || "",
        estatus: production.estatus,
      });
    } else {
      setFormData({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        direccion: "",
        telefono: "",
        correo: "",
        usuario: "",
        contrasena: "",
        foto: "",
        estatus: true,
      });
    }
    setErrors({});
  }, [production, show]);

  const handleChange = (field: keyof CreateProductionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = "El apellido paterno es requerido";
    }
    if (!formData.apellidoMaterno.trim()) {
      newErrors.apellidoMaterno = "El apellido materno es requerido";
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es requerida";
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }
    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = "El correo no es válido";
    }
    if (!formData.usuario.trim()) {
      newErrors.usuario = "El usuario es requerido";
    }
    if (!production && !formData.contrasena.trim()) {
      newErrors.contrasena = "La contraseña es requerida";
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

  const isEditing = !!production;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-bottom-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <User size={20} className="text-primary" />
          {isEditing ? "Editar Personal de Producción" : "Nuevo Personal de Producción"}
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
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Nombre <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={formData.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  isInvalid={!!errors.nombre}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nombre}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Apellido Paterno <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el apellido paterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => handleChange("apellidoPaterno", e.target.value)}
                  isInvalid={!!errors.apellidoPaterno}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.apellidoPaterno}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Apellido Materno <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el apellido materno"
                  value={formData.apellidoMaterno}
                  onChange={(e) => handleChange("apellidoMaterno", e.target.value)}
                  isInvalid={!!errors.apellidoMaterno}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.apellidoMaterno}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              Dirección <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingresa la dirección completa"
              value={formData.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
              isInvalid={!!errors.direccion}
            />
            <Form.Control.Feedback type="invalid">
              {errors.direccion}
            </Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Teléfono <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  isInvalid={!!errors.telefono}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.telefono}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Correo Electrónico <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Ingresa el correo electrónico"
                  value={formData.correo}
                  onChange={(e) => handleChange("correo", e.target.value)}
                  isInvalid={!!errors.correo}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.correo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Usuario <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el nombre de usuario"
                  value={formData.usuario}
                  onChange={(e) => handleChange("usuario", e.target.value)}
                  isInvalid={!!errors.usuario}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.usuario}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Contraseña {!isEditing && <span className="text-danger">*</span>}
                  {isEditing && <small className="text-muted">(Dejar vacío para mantener actual)</small>}
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa la contraseña"
                    value={formData.contrasena}
                    onChange={(e) => handleChange("contrasena", e.target.value)}
                    isInvalid={!!errors.contrasena}
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y pe-3"
                    style={{ border: "none", background: "none", zIndex: 10 }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {errors.contrasena}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Foto</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  // Aquí podrías agregar lógica para subir el archivo
                  // Por ahora guardamos el nombre del archivo
                  handleChange("foto", file.name);
                }
              }}
            />
            {formData.foto && (
              <Form.Text className="text-muted">
                Archivo seleccionado: {formData.foto}
              </Form.Text>
            )}
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Activo"
                  checked={formData.estatus}
                  onChange={(e) => handleChange("estatus", e.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-top-0 pt-0">
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
              {isEditing ? "Actualizar" : "Crear"} Personal
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductionModal;