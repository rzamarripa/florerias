"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { AlertTriangle } from "lucide-react";

interface CancelSaleConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (reason: string) => void;
  saleOrderNumber: string;
  isProcessing: boolean;
}

const CancelSaleConfirmDialog: React.FC<CancelSaleConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  saleOrderNumber,
  isProcessing,
}) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");

  // Limpiar el estado cuando se cierra el modal
  useEffect(() => {
    if (!show) {
      setCancellationReason("");
      setError("");
    }
  }, [show]);

  const handleConfirm = () => {
    if (!cancellationReason.trim()) {
      setError("El motivo de cancelación es requerido");
      return;
    }
    if (cancellationReason.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }
    setError("");
    onConfirm(cancellationReason.trim());
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCancellationReason(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton={!isProcessing}>
        <Modal.Title className="fw-bold">Cancelar Venta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#fff3cd",
            }}
          >
            <AlertTriangle size={40} className="text-warning" />
          </div>
          <h5 className="mb-3">¿Estás seguro de cancelar esta venta?</h5>
          <p className="text-muted mb-2">
            Folio: <strong>{saleOrderNumber}</strong>
          </p>
        </div>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            Motivo de cancelación <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Escribe el motivo de la cancelación..."
            value={cancellationReason}
            onChange={handleReasonChange}
            disabled={isProcessing}
            isInvalid={!!error}
            maxLength={500}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
          <Form.Text className="text-muted">
            {cancellationReason.length}/500 caracteres
          </Form.Text>
        </Form.Group>

        <div
          className="alert alert-warning d-flex align-items-start mb-0"
          role="alert"
        >
          <AlertTriangle size={20} className="me-2 mt-1 flex-shrink-0" />
          <div>
            <strong>Nota:</strong> Esta acción no se puede deshacer. La venta
            permanecerá en el sistema con estado "Cancelado".
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={isProcessing}>
          No, mantener venta
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={isProcessing || !cancellationReason.trim()}
        >
          {isProcessing ? "Cancelando..." : "Sí, cancelar venta"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CancelSaleConfirmDialog;
