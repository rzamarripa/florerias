"use client";

import React, { useState } from "react";
import { Form, Button, Alert, Modal } from "react-bootstrap";
import { Shield } from "lucide-react";
import { toast } from "react-toastify";

interface DiscountAuthModalProps {
  show: boolean;
  onHide: () => void;
  discount: number;
  discountType: "porcentaje" | "cantidad";
  onConfirm: (message: string) => void;
}

const DiscountAuthModal: React.FC<DiscountAuthModalProps> = ({
  show,
  onHide,
  discount,
  discountType,
  onConfirm,
}) => {
  const [discountRequestMessage, setDiscountRequestMessage] = useState("");
  const [requestingDiscount, setRequestingDiscount] = useState(false);

  const handleRequestDiscountAuth = async () => {
    if (!discountRequestMessage.trim()) {
      toast.error("Por favor ingresa un mensaje de solicitud");
      return;
    }

    if (discount <= 0) {
      toast.error("El valor del descuento debe ser mayor a 0");
      return;
    }

    setRequestingDiscount(true);

    // Llamar al callback del padre con el mensaje
    onConfirm(discountRequestMessage);

    // Limpiar y cerrar
    setDiscountRequestMessage("");
    setRequestingDiscount(false);
    onHide();

    toast.success("Descuento aplicado. Se creará la solicitud al guardar la orden.");
  };

  const handleClose = () => {
    setDiscountRequestMessage("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-warning text-white">
        <Modal.Title className="d-flex align-items-center gap-2">
          <Shield size={24} />
          Confirmar Solicitud de Descuento
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-3">
          <strong>ℹ️ Información:</strong> El descuento se aplicará
          inmediatamente a la orden, pero necesita autorización del gerente
          antes de enviarse a producción.
        </Alert>

        <div className="mb-3 p-3 border rounded bg-light">
          <h6 className="fw-bold mb-2">Descuento solicitado:</h6>
          <p className="mb-0 fs-5 text-primary">
            {discount} {discountType === "porcentaje" ? "%" : "$"}
          </p>
        </div>

        <Form.Group>
          <Form.Label className="fw-semibold">
            Motivo de la solicitud <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Describe el motivo por el cual solicitas este descuento..."
            value={discountRequestMessage}
            onChange={(e) => setDiscountRequestMessage(e.target.value)}
            required
          />
          <Form.Text className="text-muted">
            El gerente recibirá esta solicitud junto con la orden creada. Si la
            rechaza, la orden será cancelada automáticamente.
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={requestingDiscount}
        >
          Cancelar
        </Button>
        <Button
          variant="warning"
          onClick={handleRequestDiscountAuth}
          disabled={requestingDiscount || !discountRequestMessage.trim()}
          className="d-flex align-items-center gap-2"
        >
          <Shield size={16} />
          {requestingDiscount ? "Aplicando..." : "Aplicar y Continuar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DiscountAuthModal;
