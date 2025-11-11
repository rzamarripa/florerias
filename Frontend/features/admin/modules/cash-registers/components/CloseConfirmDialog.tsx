"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { DollarSign, AlertTriangle } from "lucide-react";

interface CloseConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (remainingBalance: number) => void;
  currentBalance: number;
  isClosing: boolean;
}

const CloseConfirmDialog: React.FC<CloseConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  currentBalance,
  isClosing,
}) => {
  const [remainingBalance, setRemainingBalance] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setRemainingBalance("");
      setError("");
    }
  }, [show]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const handleInputChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, "");
    setRemainingBalance(sanitized);
    setError("");
  };

  const handleConfirm = () => {
    const parsed = parseFloat(remainingBalance);

    // Validations
    if (!remainingBalance || isNaN(parsed)) {
      setError("Por favor ingresa un monto válido");
      return;
    }

    if (parsed < 0) {
      setError("El saldo no puede ser negativo");
      return;
    }

    if (parsed > currentBalance) {
      setError(
        `El saldo restante no puede ser mayor al saldo actual de ${formatCurrency(
          currentBalance
        )}`
      );
      return;
    }

    onConfirm(parsed);
  };

  const withdrawAmount = remainingBalance
    ? currentBalance - parseFloat(remainingBalance)
    : 0;

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton={!isClosing}>
        <Modal.Title className="fw-bold">Cerrar Caja Registradora</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <Alert variant="info" className="d-flex align-items-start">
            <AlertTriangle size={20} className="me-2 mt-1 flex-shrink-0" />
            <div>
              <strong>Importante:</strong> Ingresa el saldo que quedará en la
              caja después del cierre. Este será el saldo inicial para la
              próxima apertura.
            </div>
          </Alert>
        </div>

        <div
          className="mb-4 p-3 rounded"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted">Saldo actual de la caja:</span>
            <span className="fw-bold fs-5 text-primary">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            ¿Cuánto saldo quedará en la caja?
          </Form.Label>
          <div className="position-relative">
            <DollarSign
              size={20}
              className="position-absolute"
              style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <Form.Control
              type="text"
              placeholder="0.00"
              value={remainingBalance}
              onChange={(e) => handleInputChange(e.target.value)}
              isInvalid={!!error}
              disabled={isClosing}
              style={{
                paddingLeft: "40px",
                fontSize: "1.1rem",
                fontWeight: "500",
              }}
              autoFocus
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </div>
          <Form.Text className="text-muted">
            Ingresa solo números (ejemplo: 500 o 1500.50)
          </Form.Text>
        </Form.Group>

        {remainingBalance && !error && parseFloat(remainingBalance) >= 0 && (
          <div
            className="p-3 rounded mb-3"
            style={{
              backgroundColor: withdrawAmount > 0 ? "#fff3cd" : "#d1ecf1",
              border: `1px solid ${
                withdrawAmount > 0 ? "#ffc107" : "#bee5eb"
              }`,
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold">
                {withdrawAmount > 0 ? "Se retirará:" : "Saldo final:"}
              </span>
              <span className="fw-bold fs-5">
                {formatCurrency(withdrawAmount)}
              </span>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={isClosing}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={isClosing || !remainingBalance}
        >
          {isClosing ? "Cerrando..." : "Confirmar y Cerrar Caja"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CloseConfirmDialog;
