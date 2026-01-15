import React, { useState, useEffect } from "react";
import { Modal, Button, Badge, Spinner, Nav, Tab } from "react-bootstrap";
import {
  X,
  Gift,
  Clock,
  CheckCircle,
  Copy,
  Calendar,
  ShoppingCart,
  Award,
  Package
} from "lucide-react";
import { Client } from "../types";
import { clientsService } from "../services/clients";
import { toast } from "react-toastify";

interface ClientReward {
  _id: string;
  reward: {
    _id: string;
    name: string;
    description: string;
    pointsRequired: number;
    rewardValue: number;
    isPercentage: boolean;
  };
  code: string;
  isRedeemed: boolean;
  redeemedAt: string | null;
  usedAt: string | null;
  usedInOrder: any | null;
}

interface ClientRedeemedRewardsModalProps {
  show: boolean;
  onHide: () => void;
  client: Client | null;
}

const ClientRedeemedRewardsModal: React.FC<ClientRedeemedRewardsModalProps> = ({
  show,
  onHide,
  client,
}) => {
  const [rewards, setRewards] = useState<ClientReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "used">("pending");

  useEffect(() => {
    if (show && client) {
      loadRewards();
    }
  }, [show, client]);

  const loadRewards = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const response = await clientsService.getClientRewards(client._id);
      if (response.success && response.data) {
        setRewards(response.data);
      }
    } catch (error: any) {
      console.error("Error loading client rewards:", error);
      toast.error("Error al cargar las recompensas del cliente");
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado al portapapeles");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingRewards = rewards.filter((r) => !r.isRedeemed);
  const usedRewards = rewards.filter((r) => r.isRedeemed);

  if (!client) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-info text-white d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: "40px", height: "40px" }}
          >
            <Gift size={20} />
          </div>
          <div>
            <Modal.Title className="mb-0 fs-5">Recompensas Reclamadas</Modal.Title>
            <small className="text-muted">
              {client.name} {client.lastName}
            </small>
          </div>
        </div>
        <Button variant="link" className="text-muted p-0" onClick={onHide}>
          <X size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" className="text-primary mb-3" />
            <p className="text-muted">Cargando recompensas...</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-5">
            <Package size={48} className="text-muted mb-3 opacity-50" />
            <h6 className="text-muted">No hay recompensas reclamadas</h6>
            <p className="text-muted small">
              El cliente aún no ha reclamado ninguna recompensa
            </p>
          </div>
        ) : (
          <>
            {/* Estadísticas rápidas */}
            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="border rounded-3 p-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Clock size={16} className="text-warning" />
                    <small className="text-muted">Pendientes de usar</small>
                  </div>
                  <h4 className="mb-0 text-warning">{pendingRewards.length}</h4>
                </div>
              </div>
              <div className="col-6">
                <div className="border rounded-3 p-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-success" />
                    <small className="text-muted">Ya usadas</small>
                  </div>
                  <h4 className="mb-0 text-success">{usedRewards.length}</h4>
                </div>
              </div>
            </div>

            {/* Tabs para separar pendientes y usadas */}
            <Tab.Container activeKey={activeTab}>
              <Nav variant="pills" className="mb-3">
                <Nav.Item>
                  <Nav.Link
                    eventKey="pending"
                    onClick={() => setActiveTab("pending")}
                    className="d-flex align-items-center gap-2"
                  >
                    <Clock size={16} />
                    Pendientes ({pendingRewards.length})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    eventKey="used"
                    onClick={() => setActiveTab("used")}
                    className="d-flex align-items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Usadas ({usedRewards.length})
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="pending">
                  {pendingRewards.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-3">
                      <Clock size={32} className="text-muted mb-2 opacity-50" />
                      <p className="text-muted mb-0">
                        No hay recompensas pendientes de usar
                      </p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {pendingRewards.map((item) => (
                        <div
                          key={item._id}
                          className="border border-warning bg-warning bg-opacity-10 rounded-3 p-3"
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">{item.reward.name}</h6>
                              <p className="text-muted small mb-2">
                                {item.reward.description}
                              </p>
                              <div className="d-flex align-items-center gap-3 mb-2">
                                <Badge bg="warning" text="dark">
                                  {item.reward.isPercentage
                                    ? `${item.reward.rewardValue}% descuento`
                                    : `$${item.reward.rewardValue} de valor`}
                                </Badge>
                                <small className="text-muted">
                                  <Award size={14} className="me-1" />
                                  {item.reward.pointsRequired} pts
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-2 p-2 mb-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="text-muted d-block mb-1">
                                  Código de canje:
                                </small>
                                <h5 className="mb-0 font-monospace text-primary">
                                  {item.code}
                                </h5>
                              </div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => copyCodeToClipboard(item.code)}
                                className="d-flex align-items-center gap-1"
                              >
                                <Copy size={14} />
                                Copiar
                              </Button>
                            </div>
                          </div>

                          <small className="text-muted">
                            <Calendar size={12} className="me-1" />
                            Reclamado: {formatDate(item.redeemedAt)}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="used">
                  {usedRewards.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-3">
                      <CheckCircle size={32} className="text-muted mb-2 opacity-50" />
                      <p className="text-muted mb-0">
                        No hay recompensas usadas aún
                      </p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {usedRewards.map((item) => (
                        <div
                          key={item._id}
                          className="border border-success bg-success bg-opacity-10 rounded-3 p-3"
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">
                                <CheckCircle
                                  size={16}
                                  className="text-success me-1"
                                />
                                {item.reward.name}
                              </h6>
                              <p className="text-muted small mb-2">
                                {item.reward.description}
                              </p>
                              <div className="d-flex align-items-center gap-3 mb-2">
                                <Badge bg="success">
                                  {item.reward.isPercentage
                                    ? `${item.reward.rewardValue}% aplicado`
                                    : `$${item.reward.rewardValue} aplicado`}
                                </Badge>
                                <small className="text-muted">
                                  <Award size={14} className="me-1" />
                                  {item.reward.pointsRequired} pts usados
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-2 p-2 mb-2">
                            <div className="row small">
                              <div className="col-6">
                                <span className="text-muted">Código usado:</span>
                                <div className="fw-medium font-monospace">
                                  {item.code}
                                </div>
                              </div>
                              {item.usedInOrder && (
                                <div className="col-6">
                                  <span className="text-muted">Orden:</span>
                                  <div className="fw-medium">
                                    <ShoppingCart size={14} className="me-1" />
                                    #{item.usedInOrder.orderNumber || item.usedInOrder._id}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between small text-muted">
                            <span>
                              <Calendar size={12} className="me-1" />
                              Reclamado: {formatDate(item.redeemedAt)}
                            </span>
                            <span>
                              <CheckCircle size={12} className="me-1" />
                              Usado: {formatDate(item.usedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClientRedeemedRewardsModal;