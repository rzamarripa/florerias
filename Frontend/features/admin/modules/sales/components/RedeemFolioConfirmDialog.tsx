"use client";

import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

interface RedeemFolioConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (folio: string) => Promise<void>;
  saleOrderNumber: string;
}

const RedeemFolioConfirmDialog: React.FC<RedeemFolioConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  saleOrderNumber,
}) => {
  const [folio, setFolio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!folio.trim()) return;

    try {
      setIsSubmitting(true);
      await onConfirm(folio.trim());
      // Si llega aquí, fue exitoso
      handleClose();
    } catch (error: any) {
      // Mostrar el error en un toast
      const errorMessage = error?.message || error?.error?.message || "Error al canjear el folio de autorización";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFolio("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <CheckCircle size={24} className="text-success" />
          Canjear Folio de Autorización
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <p className="mb-3">
            ¿Estás seguro de que deseas canjear el folio de autorización para la orden{" "}
            <strong>{saleOrderNumber}</strong>?
          </p>
          <p className="text-muted mb-3">
            Al canjear el folio, la orden será enviada automáticamente a producción.
          </p>
          <Form.Group>
            <Form.Label className="fw-semibold">
              Folio de Autorización <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: 12345"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              maxLength={5}
              onKeyDown={(e) => {
                if (e.key === "Enter" && folio.trim() && !isSubmitting) {
                  handleConfirm();
                }
              }}
            />
            <Form.Text className="text-muted">
              Ingresa el folio de 5 dígitos generado al aprobar el descuento
            </Form.Text>
          </Form.Group>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          disabled={isSubmitting || !folio.trim()}
        >
          {isSubmitting ? "Canjeando..." : "Canjear Folio"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RedeemFolioConfirmDialog;
