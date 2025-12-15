import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Card } from "react-bootstrap";
import { X, Save, Award } from "lucide-react";
import {
  PointsConfig,
  CreatePointsConfigData,
  UpdatePointsConfigData,
} from "../types";

interface PointsConfigModalProps {
  show: boolean;
  onHide: () => void;
  config?: PointsConfig | null;
  onSave: (data: CreatePointsConfigData | UpdatePointsConfigData) => void;
  loading?: boolean;
}

const defaultFormData: CreatePointsConfigData = {
  pointsPerPurchaseAmount: {
    enabled: true,
    amount: 100,
    points: 1,
  },
  pointsPerAccumulatedPurchases: {
    enabled: false,
    purchasesRequired: 5,
    points: 10,
  },
  pointsForFirstPurchase: {
    enabled: true,
    points: 5,
  },
  pointsForClientRegistration: {
    enabled: true,
    points: 10,
  },
  pointsForBranchVisit: {
    enabled: false,
    points: 2,
    maxVisitsPerDay: 1,
  },
  branch: "",
  status: true,
};

const PointsConfigModal: React.FC<PointsConfigModalProps> = ({
  show,
  onHide,
  config,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePointsConfigData>(defaultFormData);

  useEffect(() => {
    if (config) {
      setFormData({
        pointsPerPurchaseAmount: config.pointsPerPurchaseAmount,
        pointsPerAccumulatedPurchases: config.pointsPerAccumulatedPurchases,
        pointsForFirstPurchase: config.pointsForFirstPurchase,
        pointsForClientRegistration: config.pointsForClientRegistration,
        pointsForBranchVisit: config.pointsForBranchVisit,
        branch: typeof config.branch === "string" ? config.branch : config.branch._id,
        status: config.status,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [config, show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!config;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header className="border-bottom-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <Award size={20} className="text-primary" />
          {isEditing ? "Editar Configuración de Puntos" : "Nueva Configuración de Puntos"}
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
          {/* Puntos por Total de Compra */}
          <Card className="mb-3">
            <Card.Header className="bg-light py-2">
              <Form.Check
                type="switch"
                id="purchaseAmountEnabled"
                label={<strong>Puntos por Total de Compra</strong>}
                checked={formData.pointsPerPurchaseAmount?.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointsPerPurchaseAmount: {
                      ...formData.pointsPerPurchaseAmount!,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
            </Card.Header>
            {formData.pointsPerPurchaseAmount?.enabled && (
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Por cada $ (monto)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={formData.pointsPerPurchaseAmount?.amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsPerPurchaseAmount: {
                              ...formData.pointsPerPurchaseAmount!,
                              amount: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Puntos a otorgar</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.pointsPerPurchaseAmount?.points}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsPerPurchaseAmount: {
                              ...formData.pointsPerPurchaseAmount!,
                              points: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <small className="text-muted">
                  Ejemplo: Por cada ${formData.pointsPerPurchaseAmount?.amount} de compra, el cliente recibe {formData.pointsPerPurchaseAmount?.points} punto(s).
                </small>
              </Card.Body>
            )}
          </Card>

          {/* Puntos por Compras Acumuladas */}
          <Card className="mb-3">
            <Card.Header className="bg-light py-2">
              <Form.Check
                type="switch"
                id="accumulatedPurchasesEnabled"
                label={<strong>Puntos por Compras Acumuladas</strong>}
                checked={formData.pointsPerAccumulatedPurchases?.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointsPerAccumulatedPurchases: {
                      ...formData.pointsPerAccumulatedPurchases!,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
            </Card.Header>
            {formData.pointsPerAccumulatedPurchases?.enabled && (
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Compras requeridas</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={formData.pointsPerAccumulatedPurchases?.purchasesRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsPerAccumulatedPurchases: {
                              ...formData.pointsPerAccumulatedPurchases!,
                              purchasesRequired: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Puntos a otorgar</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.pointsPerAccumulatedPurchases?.points}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsPerAccumulatedPurchases: {
                              ...formData.pointsPerAccumulatedPurchases!,
                              points: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <small className="text-muted">
                  Ejemplo: Por cada {formData.pointsPerAccumulatedPurchases?.purchasesRequired} compras acumuladas, el cliente recibe {formData.pointsPerAccumulatedPurchases?.points} punto(s).
                </small>
              </Card.Body>
            )}
          </Card>

          {/* Puntos por Primera Venta */}
          <Card className="mb-3">
            <Card.Header className="bg-light py-2">
              <Form.Check
                type="switch"
                id="firstPurchaseEnabled"
                label={<strong>Puntos por Primera Compra</strong>}
                checked={formData.pointsForFirstPurchase?.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointsForFirstPurchase: {
                      ...formData.pointsForFirstPurchase!,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
            </Card.Header>
            {formData.pointsForFirstPurchase?.enabled && (
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Puntos a otorgar</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.pointsForFirstPurchase?.points}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsForFirstPurchase: {
                              ...formData.pointsForFirstPurchase!,
                              points: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <small className="text-muted">
                  Puntos de bienvenida al realizar la primera compra.
                </small>
              </Card.Body>
            )}
          </Card>

          {/* Puntos por Registro de Cliente */}
          <Card className="mb-3">
            <Card.Header className="bg-light py-2">
              <Form.Check
                type="switch"
                id="clientRegistrationEnabled"
                label={<strong>Puntos por Registro de Cliente</strong>}
                checked={formData.pointsForClientRegistration?.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointsForClientRegistration: {
                      ...formData.pointsForClientRegistration!,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
            </Card.Header>
            {formData.pointsForClientRegistration?.enabled && (
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Puntos a otorgar</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.pointsForClientRegistration?.points}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsForClientRegistration: {
                              ...formData.pointsForClientRegistration!,
                              points: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <small className="text-muted">
                  Puntos al registrarse como cliente nuevo.
                </small>
              </Card.Body>
            )}
          </Card>

          {/* Puntos por Visita a Sucursal */}
          <Card className="mb-3">
            <Card.Header className="bg-light py-2">
              <Form.Check
                type="switch"
                id="branchVisitEnabled"
                label={<strong>Puntos por Visita a Sucursal</strong>}
                checked={formData.pointsForBranchVisit?.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointsForBranchVisit: {
                      ...formData.pointsForBranchVisit!,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
            </Card.Header>
            {formData.pointsForBranchVisit?.enabled && (
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Puntos a otorgar</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.pointsForBranchVisit?.points}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsForBranchVisit: {
                              ...formData.pointsForBranchVisit!,
                              points: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Visitas máximas por día</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={formData.pointsForBranchVisit?.maxVisitsPerDay}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsForBranchVisit: {
                              ...formData.pointsForBranchVisit!,
                              maxVisitsPerDay: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <small className="text-muted">
                  Limita cuántas veces al día puede recibir puntos por visita.
                </small>
              </Card.Body>
            )}
          </Card>

          {/* Estado */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Configuración Activa"
              checked={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.checked,
                })
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
              {isEditing ? "Actualizar" : "Crear"} Configuración
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PointsConfigModal;
