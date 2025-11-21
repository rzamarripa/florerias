import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { X, Save, User, Eye, EyeOff, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { Cashier, CreateCashierData, UpdateCashierData } from "../types";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { branchesService } from "@/features/admin/modules/branches/services/branches";

interface CashierModalProps {
  show: boolean;
  onHide: () => void;
  cashier?: Cashier | null;
  onSave: (data: CreateCashierData | UpdateCashierData) => void;
  loading?: boolean;
}

const CashierModal: React.FC<CashierModalProps> = ({
  show,
  onHide,
  cashier,
  onSave,
  loading = false,
}) => {
  const { getIsAdmin, getIsManager } = useUserRoleStore();
  const isAdminOrManager = getIsAdmin() || getIsManager();

  const [formData, setFormData] = useState<any>({
    username: "",
    email: "",
    phone: "",
    password: "",
    profile: {
      name: "",
      lastName: "",
    },
    branch: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userCompany, setUserCompany] = useState<any>(null);
  const [loadingUserCompany, setLoadingUserCompany] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Load user company for Admin/Manager
  const loadUserCompany = async () => {
    if (!isAdminOrManager) return;

    setLoadingUserCompany(true);
    try {
      const response = await companiesService.getUserCompany();
      if (response.success && response.data) {
        setUserCompany(response.data);
        // Load branches for this company
        await loadBranches(response.data._id);
      }
    } catch (err: any) {
      console.error("Error loading user company:", err);
      if (!err.message?.includes("no tiene una empresa asignada")) {
        toast.error(err.message || "Error al cargar la empresa del usuario");
      }
    } finally {
      setLoadingUserCompany(false);
    }
  };

  // Load branches for the company
  const loadBranches = async (companyId: string) => {
    setLoadingBranches(true);
    try {
      const response = await branchesService.getAllBranches({
        companyId,
        isActive: true,
        limit: 100,
      });
      if (response.success && response.data) {
        setBranches(response.data);
      }
    } catch (err: any) {
      console.error("Error loading branches:", err);
      toast.error(err.message || "Error al cargar las sucursales");
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (show && isAdminOrManager) {
      loadUserCompany();
    }
  }, [show, isAdminOrManager]);

  useEffect(() => {
    if (cashier) {
      setFormData({
        username: cashier.username,
        email: cashier.email,
        phone: cashier.phone,
        password: "",
        profile: {
          name: cashier.profile.name,
          lastName: cashier.profile.lastName,
        },
        branch: cashier.branch?._id || "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
        branch: "",
      });
    }
    setErrors({});
  }, [cashier, show]);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith("profile.")) {
      const profileField = field.split(".")[1];
      setFormData((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo no es válido";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }
    if (!formData.profile.name.trim()) {
      newErrors["profile.name"] = "El nombre es requerido";
    }
    if (!formData.profile.lastName.trim()) {
      newErrors["profile.lastName"] = "El apellido es requerido";
    }
    if (!cashier && !formData.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    }
    if (!formData.branch) {
      newErrors.branch = "La sucursal es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (cashier) {
        // For update, only send changed fields
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          profile: {
            name: formData.profile.name,
            lastName: formData.profile.lastName,
          },
        };
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        onSave(updateData);
      } else {
        // For create, send all required fields
        onSave(formData);
      }
    }
  };

  const isEditing = !!cashier;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-bottom-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <User size={20} className="text-primary" />
          {isEditing ? "Editar Cajero" : "Nuevo Cajero"}
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
        {isAdminOrManager && userCompany && (
          <Alert variant="info" className="d-flex align-items-center gap-2 mb-3">
            <Building2 size={18} />
            <div>
              <strong>Empresa:</strong> {userCompany.tradeName || userCompany.legalName}
              <br />
              <small className="text-muted">RFC: {userCompany.rfc}</small>
            </div>
          </Alert>
        )}

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
                  value={formData.profile.name}
                  onChange={(e) => handleChange("profile.name", e.target.value)}
                  isInvalid={!!errors["profile.name"]}
                />
                <Form.Control.Feedback type="invalid">
                  {errors["profile.name"]}
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
                  value={formData.profile.lastName}
                  onChange={(e) => handleChange("profile.lastName", e.target.value)}
                  isInvalid={!!errors["profile.lastName"]}
                />
                <Form.Control.Feedback type="invalid">
                  {errors["profile.lastName"]}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Nombre de Usuario <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el nombre de usuario"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  isInvalid={!!errors.username}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.username}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Teléfono <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  isInvalid={!!errors.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>
              Correo Electrónico <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="Ingresa el correo electrónico"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Contraseña {!isEditing && <span className="text-danger">*</span>}
              {isEditing && <small className="text-muted"> (Dejar vacío para mantener actual)</small>}
            </Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa la contraseña"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                isInvalid={!!errors.password}
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
                {errors.password}
              </Form.Control.Feedback>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Sucursal <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={formData.branch}
              onChange={(e) => handleChange("branch", e.target.value)}
              isInvalid={!!errors.branch}
              disabled={loadingBranches || isEditing}
            >
              <option value="">
                {loadingBranches ? "Cargando sucursales..." : "Selecciona una sucursal"}
              </option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.branchName} ({branch.branchCode})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.branch}
            </Form.Control.Feedback>
            {isEditing && (
              <Form.Text className="text-muted">
                La sucursal no se puede cambiar al editar un cajero
              </Form.Text>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-top-0 pt-0">
        <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || loadingUserCompany || loadingBranches}
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
              {isEditing ? "Actualizar" : "Crear"} Cajero
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CashierModal;
