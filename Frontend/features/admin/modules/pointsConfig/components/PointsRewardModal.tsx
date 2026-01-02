import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { X, Save, Gift } from "lucide-react";
import {
  PointsReward,
  CreatePointsRewardData,
  UpdatePointsRewardData,
  RewardType,
} from "../types";

interface PointsRewardModalProps {
  show: boolean;
  onHide: () => void;
  reward?: PointsReward | null;
  onSave: (data: CreatePointsRewardData | UpdatePointsRewardData) => void;
  loading?: boolean;
}

const rewardTypeOptions: { value: RewardType; label: string }[] = [
  { value: "discount", label: "Descuento" },
  { value: "product", label: "Producto" },
  { value: "service", label: "Servicio" },
  { value: "other", label: "Otro" },
];

const defaultFormData: CreatePointsRewardData = {
  name: "",
  description: "",
  pointsRequired: 100,
  rewardType: "discount",
  rewardValue: 10,
  isPercentage: true,
  maxRedemptionsPerClient: 0,
  maxTotalRedemptions: 0,
  validFrom: null,
  validUntil: null,
  branch: "",
  status: true,
};

const PointsRewardModal: React.FC<PointsRewardModalProps> = ({
  show,
  onHide,
  reward,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePointsRewardData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        description: reward.description || "",
        pointsRequired: reward.pointsRequired,
        rewardType: reward.rewardType,
        rewardValue: reward.rewardValue,
        isPercentage: reward.isPercentage,
        maxRedemptionsPerClient: reward.maxRedemptionsPerClient,
        maxTotalRedemptions: reward.maxTotalRedemptions,
        validFrom: reward.validFrom ? reward.validFrom.split("T")[0] : null,
        validUntil: reward.validUntil ? reward.validUntil.split("T")[0] : null,
        branch: typeof reward.branch === "string" ? reward.branch : reward.branch._id,
        status: reward.status,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [reward, show]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!formData.pointsRequired || formData.pointsRequired < 1) {
      newErrors.pointsRequired = "Los puntos deben ser al menos 1";
    }
    if (formData.rewardValue === undefined || formData.rewardValue < 0) {
      newErrors.rewardValue = "El valor debe ser mayor o igual a 0";
    }
    if (formData.isPercentage && formData.rewardValue && formData.rewardValue > 100) {
      newErrors.rewardValue = "El porcentaje no puede ser mayor a 100";
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

  const isEditing = !!reward;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-bottom-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <Gift size={20} className="text-primary" />
          {isEditing ? "Editar Recompensa" : "Nueva Recompensa"}
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
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Nombre de la Recompensa <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej: Descuento del 10%"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Puntos Requeridos <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={formData.pointsRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pointsRequired: parseInt(e.target.value) || 1,
                    })
                  }
                  isInvalid={!!errors.pointsRequired}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.pointsRequired}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Descripción opcional de la recompensa"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Recompensa</Form.Label>
                <Form.Select
                  value={formData.rewardType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rewardType: e.target.value as RewardType,
                    })
                  }
                >
                  {rewardTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Valor <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step={formData.isPercentage ? "1" : "0.01"}
                  value={formData.rewardValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rewardValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  isInvalid={!!errors.rewardValue}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.rewardValue}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Valor</Form.Label>
                <Form.Select
                  value={formData.isPercentage ? "percentage" : "fixed"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPercentage: e.target.value === "percentage",
                    })
                  }
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Canjes máx. por cliente</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="0 = ilimitado"
                  value={formData.maxRedemptionsPerClient}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxRedemptionsPerClient: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Form.Text className="text-muted">
                  0 = sin límite por cliente
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Canjes máx. totales</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="0 = ilimitado"
                  value={formData.maxTotalRedemptions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxTotalRedemptions: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Form.Text className="text-muted">
                  0 = sin límite total
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Válido desde</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.validFrom || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validFrom: e.target.value || null,
                    })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Válido hasta</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.validUntil || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validUntil: e.target.value || null,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Recompensa Activa"
              checked={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.checked })
              }
            />
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
              {isEditing ? "Actualizar" : "Crear"} Recompensa
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PointsRewardModal;
