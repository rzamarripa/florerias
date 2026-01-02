import React, { useState, useEffect } from "react";
import { Modal, Button, Table, ProgressBar, Spinner } from "react-bootstrap";
import {
  X,
  Award,
  TrendingUp,
  Gift,
  ShoppingBag,
  UserPlus,
  RefreshCw,
  Star,
  Check,
  Copy,
} from "lucide-react";
import { Client, ClientPointsHistory, PointsHistoryReason } from "../types";
import { clientsService } from "../services/clients";
import { pointsRewardService } from "../../pointsConfig/services/pointsReward";
import { PointsReward } from "../../pointsConfig/types";
import { toast } from "react-toastify";

interface ClientPointsDashboardModalProps {
  show: boolean;
  onHide: () => void;
  client: Client | null;
  branchId: string | null;
}

const reasonLabels: Record<PointsHistoryReason, string> = {
  purchase_amount: "Compra",
  accumulated_purchases: "Compras acumuladas",
  first_purchase: "Primera compra",
  client_registration: "Registro",
  branch_visit: "Visita a sucursal",
  redemption: "Canje",
  manual_adjustment: "Ajuste manual",
  expiration: "Expiración",
};

const reasonIcons: Record<PointsHistoryReason, React.ReactNode> = {
  purchase_amount: <ShoppingBag size={14} />,
  accumulated_purchases: <TrendingUp size={14} />,
  first_purchase: <Star size={14} />,
  client_registration: <UserPlus size={14} />,
  branch_visit: <Award size={14} />,
  redemption: <Gift size={14} />,
  manual_adjustment: <RefreshCw size={14} />,
  expiration: <X size={14} />,
};

const ClientPointsDashboardModal: React.FC<ClientPointsDashboardModalProps> = ({
  show,
  onHide,
  client,
  branchId,
}) => {
  const [history, setHistory] = useState<ClientPointsHistory[]>([]);
  const [rewards, setRewards] = useState<PointsReward[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [clientPoints, setClientPoints] = useState(0);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [redeemedRewardName, setRedeemedRewardName] = useState<string | null>(null);

  useEffect(() => {
    if (show && client && branchId) {
      loadHistory();
      loadRewards();
    }
  }, [show, client, branchId]);

  const loadHistory = async () => {
    if (!client) return;

    setLoadingHistory(true);
    try {
      const response = await clientsService.getClientPointsHistory(client._id, {
        limit: 50,
        branchId: branchId || undefined,
      });

      if (response.success) {
        setHistory(response.data || []);
        setClientPoints(response.clientPoints || client.points);
      }
    } catch (error: any) {
      console.error("Error loading points history:", error);
      toast.error("Error al cargar el historial de puntos");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadRewards = async () => {
    if (!branchId) return;

    setLoadingRewards(true);
    try {
      const response = await pointsRewardService.getPointsRewardsByBranch(
        branchId,
        { status: true }
      );

      if (response.success) {
        setRewards(response.data || []);
      }
    } catch (error: any) {
      console.error("Error loading rewards:", error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateProgress = (pointsRequired: number) => {
    if (pointsRequired <= 0) return 100;
    const progress = (clientPoints / pointsRequired) * 100;
    return Math.min(progress, 100);
  };

  const getPointsRemaining = (pointsRequired: number) => {
    const remaining = pointsRequired - clientPoints;
    return remaining > 0 ? remaining : 0;
  };

  const handleRedeemReward = async (reward: PointsReward) => {
    if (!client || !branchId) return;

    setRedeemingRewardId(reward._id);
    try {
      const response = await clientsService.redeemReward(client._id, {
        rewardId: reward._id,
        branchId,
      });

      if (response.success) {
        setGeneratedCode(response.data.code);
        setRedeemedRewardName(reward.name);
        setClientPoints(response.data.newBalance);
        setShowCodeModal(true);
        loadHistory();
        toast.success("Recompensa reclamada exitosamente");
      }
    } catch (error: any) {
      console.error("Error redeeming reward:", error);
      toast.error(error.message || "Error al reclamar la recompensa");
    } finally {
      setRedeemingRewardId(null);
    }
  };

  const copyCodeToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Código copiado al portapapeles");
    }
  };

  if (!client) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: "40px", height: "40px" }}
          >
            <Award size={20} />
          </div>
          <div>
            <Modal.Title className="mb-0 fs-5">Dashboard de Puntos</Modal.Title>
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
        {/* Balance de puntos */}
        <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="text-muted mb-1 small">Balance actual</p>
              <h2 className="mb-0 text-primary fw-bold">
                {clientPoints.toLocaleString()} pts
              </h2>
            </div>
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "60px", height: "60px" }}
            >
              <Star size={28} />
            </div>
          </div>
        </div>
        {/* Progreso hacia Recompensas - Estilo Project Performance */}
        <div>
          <h6 className="text-uppercase text-muted fw-semibold mb-3 d-flex align-items-center gap-2">
            <Gift size={16} />
            Progreso hacia Recompensas
          </h6>

          <div className="border rounded p-3">
            {loadingRewards ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" className="text-primary" />
                <p className="mb-0 mt-2 small text-muted">
                  Cargando recompensas...
                </p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-3">
                <Gift size={40} className="text-muted mb-2 opacity-50" />
                <p className="mb-0 text-muted">
                  No hay recompensas configuradas
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {rewards.map((reward) => {
                  const progress = calculateProgress(reward.pointsRequired);
                  const remaining = getPointsRemaining(reward.pointsRequired);
                  const isComplete = progress >= 100;
                  const isRedeeming = redeemingRewardId === reward._id;

                  return (
                    <div key={reward._id}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h6 className="mb-0 small fw-medium">{reward.name}</h6>
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-muted small">
                            {isComplete ? (
                              <span className="text-success fw-semibold">
                                Disponible
                              </span>
                            ) : (
                              <>Faltan {remaining} pts</>
                            )}
                          </span>
                          <span
                            className={`fw-bold ${
                              isComplete ? "text-success" : "text-primary"
                            }`}
                          >
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <ProgressBar
                        now={progress}
                        variant={isComplete ? "success" : "primary"}
                        style={{ height: "8px" }}
                        className="rounded-pill"
                      />
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="text-muted">
                          {reward.isPercentage
                            ? `${reward.rewardValue}% descuento`
                            : `$${reward.rewardValue} de valor`}
                        </small>
                        <div className="d-flex align-items-center gap-2">
                          <small className="text-muted">
                            {clientPoints} / {reward.pointsRequired} pts
                          </small>
                          {isComplete && (
                            <Button
                              variant="success"
                              size="sm"
                              className="py-0 px-2"
                              onClick={() => handleRedeemReward(reward)}
                              disabled={isRedeeming}
                            >
                              {isRedeeming ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <>
                                  <Gift size={12} className="me-1" />
                                  Reclamar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Historial de puntos */}
        <div className="mb-4">
          <h6 className="text-uppercase text-muted fw-semibold mb-3 d-flex align-items-center gap-2">
            <TrendingUp size={16} />
            Historial de Puntos
          </h6>

          <div
            className="table-responsive border rounded"
            style={{ maxHeight: "250px", overflowY: "auto" }}
          >
            {loadingHistory ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="text-primary" />
                <p className="mb-0 mt-2 small text-muted">Cargando historial...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-4">
                <Award size={40} className="text-muted mb-2 opacity-50" />
                <p className="mb-0 text-muted">No hay historial de puntos</p>
              </div>
            ) : (
              <Table className="table-sm mb-0" hover>
                <thead className="bg-light sticky-top">
                  <tr>
                    <th style={{ width: "35%" }}>Concepto</th>
                    <th style={{ width: "20%" }}>Orden</th>
                    <th className="text-end" style={{ width: "15%" }}>
                      Puntos
                    </th>
                    <th className="text-end" style={{ width: "30%" }}>
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`d-flex align-items-center justify-content-center rounded ${
                              item.type === "earned"
                                ? "bg-success bg-opacity-10 text-success"
                                : "bg-danger bg-opacity-10 text-danger"
                            }`}
                            style={{ width: "24px", height: "24px" }}
                          >
                            {reasonIcons[item.reason]}
                          </span>
                          <span className="small">
                            {reasonLabels[item.reason] || item.reason}
                          </span>
                        </div>
                      </td>
                      <td>
                        {item.orderId ? (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary small">
                            {item.orderId.orderNumber}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-end">
                        <span
                          className={`fw-semibold ${
                            item.type === "earned"
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {item.type === "earned" ? "+" : "-"}
                          {item.points}
                        </span>
                      </td>
                      <td className="text-end small text-muted">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>

        
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>

      {/* Modal para mostrar el código generado */}
      <Modal
        show={showCodeModal}
        onHide={() => setShowCodeModal(false)}
        centered
        size="sm"
      >
        <Modal.Header className="border-0 pb-0">
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-success text-white d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "40px", height: "40px" }}
            >
              <Check size={20} />
            </div>
            <div>
              <Modal.Title className="mb-0 fs-6">Recompensa Reclamada</Modal.Title>
              <small className="text-muted">{redeemedRewardName}</small>
            </div>
          </div>
          <Button
            variant="link"
            className="text-muted p-0"
            onClick={() => setShowCodeModal(false)}
          >
            <X size={20} />
          </Button>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <p className="text-muted small mb-2">Tu código de canje es:</p>
          <div className="bg-light rounded-3 p-3 mb-3">
            <h3 className="mb-0 font-monospace fw-bold text-primary letter-spacing-2">
              {generatedCode}
            </h3>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={copyCodeToClipboard}
            className="d-flex align-items-center gap-2 mx-auto"
          >
            <Copy size={14} />
            Copiar código
          </Button>
          <p className="text-muted small mt-3 mb-0">
            Presenta este código al momento de realizar tu compra para aplicar tu recompensa.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center">
          <Button variant="success" onClick={() => setShowCodeModal(false)}>
            Entendido
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

export default ClientPointsDashboardModal;
