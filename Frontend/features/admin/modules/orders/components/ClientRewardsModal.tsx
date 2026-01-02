"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Alert, Spinner, Card, Badge, Form, Image } from "react-bootstrap";
import { Gift, Check, Calendar, Percent, DollarSign, ArrowLeft, Key, Package } from "lucide-react";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { AvailableRewardItem } from "@/features/admin/modules/clients/types";

interface ClientRewardsModalProps {
  show: boolean;
  onHide: () => void;
  clientId: string;
  onSelectReward: (reward: AvailableRewardItem) => void;
}

const ClientRewardsModal: React.FC<ClientRewardsModalProps> = ({
  show,
  onHide,
  clientId,
  onSelectReward,
}) => {
  const [rewards, setRewards] = useState<AvailableRewardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<AvailableRewardItem | null>(null);

  // Estado para validación de código
  const [showCodeValidation, setShowCodeValidation] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (show && clientId) {
      fetchRewards();
    }
  }, [show, clientId]);

  useEffect(() => {
    if (!show) {
      setSelectedReward(null);
      setError(null);
      setShowCodeValidation(false);
      setCodeInput("");
      setCodeError(null);
    }
  }, [show]);

  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientsService.getAvailableRewards(clientId);
      if (response.success) {
        setRewards(response.data);
      } else {
        setError("Error al cargar las recompensas");
      }
    } catch (err: any) {
      console.error("Error al obtener recompensas:", err);
      setError(err.message || "Error al cargar las recompensas");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar paso de validación de código
  const handleProceedToValidation = () => {
    if (selectedReward) {
      setShowCodeValidation(true);
      setCodeInput("");
      setCodeError(null);
    }
  };

  // Volver a la lista de recompensas
  const handleBackToList = () => {
    setShowCodeValidation(false);
    setCodeInput("");
    setCodeError(null);
  };

  // Validar código y confirmar
  const handleConfirm = () => {
    if (!selectedReward) return;

    // Validar que el código ingresado coincida con el de la recompensa
    if (codeInput.toUpperCase().trim() !== selectedReward.code.toUpperCase()) {
      setCodeError("El código ingresado no es correcto");
      return;
    }

    // Código válido, aplicar recompensa
    onSelectReward(selectedReward);
    onHide();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Gift size={20} className="text-primary" />
          Seleccionar Recompensa
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {showCodeValidation && selectedReward ? (
          // Vista de validación de código
          <div className="py-3">
            <div className="text-center mb-4">
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                <Key size={32} className="text-primary" />
              </div>
              <h5 className="fw-bold mb-2">Ingresa el código de la recompensa</h5>
              <p className="text-muted mb-0">
                Para aplicar <strong>{selectedReward.reward.name}</strong>
              </p>
              <p className="text-muted small">
                {selectedReward.reward.isProducto && selectedReward.reward.productId
                  ? `${selectedReward.reward.productQuantity}x ${selectedReward.reward.productId.nombre}`
                  : selectedReward.reward.isPercentage
                  ? `${selectedReward.reward.rewardValue}% de descuento`
                  : `$${selectedReward.reward.rewardValue.toFixed(2)} de valor`}
              </p>
            </div>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Ingresa el código"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setCodeError(null);
                }}
                isInvalid={!!codeError}
                className="text-center py-3 fs-5 text-uppercase"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
              />
              {codeError && (
                <Form.Control.Feedback type="invalid">
                  {codeError}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </div>
        ) : loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Cargando recompensas...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : rewards.length === 0 ? (
          <Alert variant="info" className="d-flex align-items-center gap-2">
            <Gift size={18} />
            No hay recompensas disponibles para usar
          </Alert>
        ) : (
          <div className="d-flex flex-column gap-3">
            {rewards.map((rewardItem) => {
              const expired = isExpired(rewardItem.reward.validUntil);
              const isSelected = selectedReward?._id === rewardItem._id;

              return (
                <Card
                  key={rewardItem._id}
                  className={`border ${isSelected ? "border-primary border-2" : ""} ${expired ? "opacity-50" : "cursor-pointer"}`}
                  onClick={() => !expired && setSelectedReward(rewardItem)}
                  style={{ cursor: expired ? "not-allowed" : "pointer" }}
                >
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-start gap-3">
                      {/* Icono o imagen del producto */}
                      {rewardItem.reward.isProducto && rewardItem.reward.productId?.imagen ? (
                        <Image
                          src={rewardItem.reward.productId.imagen}
                          alt={rewardItem.reward.productId.nombre}
                          rounded
                          style={{ width: "60px", height: "60px", objectFit: "cover" }}
                          className={isSelected ? "border border-primary border-2" : ""}
                        />
                      ) : (
                        <div
                          className={`rounded-circle p-2 ${isSelected ? "bg-primary" : "bg-light"}`}
                          style={{ minWidth: "40px", height: "40px" }}
                        >
                          {isSelected ? (
                            <Check size={24} className="text-white" />
                          ) : rewardItem.reward.isProducto ? (
                            <Package size={24} className={expired ? "text-muted" : "text-primary"} />
                          ) : (
                            <Gift size={24} className={expired ? "text-muted" : "text-primary"} />
                          )}
                        </div>
                      )}
                      <div>
                        <h6 className="mb-1 fw-bold">
                          {rewardItem.reward.name}
                          {rewardItem.reward.isProducto && (
                            <Badge bg="info" className="ms-2">
                              Producto
                            </Badge>
                          )}
                          {expired && (
                            <Badge bg="danger" className="ms-2">
                              Expirada
                            </Badge>
                          )}
                        </h6>
                        {rewardItem.reward.description && (
                          <p className="text-muted mb-1 small">
                            {rewardItem.reward.description}
                          </p>
                        )}
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {rewardItem.reward.validFrom && (
                            <Badge bg="light" text="dark" className="d-flex align-items-center gap-1">
                              <Calendar size={12} />
                              Desde: {formatDate(rewardItem.reward.validFrom)}
                            </Badge>
                          )}
                          {rewardItem.reward.validUntil && (
                            <Badge
                              bg={expired ? "danger" : "light"}
                              text={expired ? "white" : "dark"}
                              className="d-flex align-items-center gap-1"
                            >
                              <Calendar size={12} />
                              Hasta: {formatDate(rewardItem.reward.validUntil)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      {rewardItem.reward.isProducto && rewardItem.reward.productId ? (
                        // Mostrar información del producto
                        <>
                          <div className="fs-5 fw-bold text-primary">
                            {rewardItem.reward.productQuantity}x
                          </div>
                          <small className="text-muted d-block" style={{ maxWidth: "120px" }}>
                            {rewardItem.reward.productId.nombre}
                          </small>
                          <small className="text-success">
                            Gratis
                          </small>
                        </>
                      ) : (
                        // Mostrar descuento
                        <>
                          <div className="d-flex align-items-center gap-1 justify-content-end">
                            {rewardItem.reward.isPercentage ? (
                              <>
                                <Percent size={18} className="text-success" />
                                <span className="fs-4 fw-bold text-success">
                                  {rewardItem.reward.rewardValue}%
                                </span>
                              </>
                            ) : (
                              <>
                                <DollarSign size={18} className="text-success" />
                                <span className="fs-4 fw-bold text-success">
                                  ${rewardItem.reward.rewardValue.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                          <small className="text-muted">
                            {rewardItem.reward.isPercentage ? "descuento" : "de valor"}
                          </small>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {showCodeValidation ? (
          <>
            <Button variant="outline-secondary" onClick={handleBackToList}>
              <ArrowLeft size={16} className="me-1" />
              Volver
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!codeInput.trim()}
            >
              <Check size={16} className="me-1" />
              Validar y Aplicar
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={onHide}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleProceedToValidation}
              disabled={!selectedReward || isExpired(selectedReward?.reward.validUntil || null)}
            >
              <Check size={16} className="me-1" />
              Continuar
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ClientRewardsModal;
