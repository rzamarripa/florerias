"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { eventPaymentsService } from "../services/eventPayments";
import { CreateEventPaymentData, Event, PaymentMethod } from "../types";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";

interface AddEventPaymentModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  event: Event;
}

const AddEventPaymentModal: React.FC<AddEventPaymentModalProps> = ({
  show,
  onHide,
  onSuccess,
  event,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [formData, setFormData] = useState<CreateEventPaymentData>({
    eventId: event._id,
    amount: 0,
    paymentMethod: "",
    notes: "",
  });

  // Cargar métodos de pago
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await paymentMethodsService.getAllPaymentMethods({
          status: true,
          limit: 1000,
        });
        if (response.data) {
          setPaymentMethods(response.data);
        }
      } catch (error) {
        console.error("Error loading payment methods:", error);
      }
    };

    if (show) {
      loadPaymentMethods();
    }
  }, [show]);

  // Reiniciar eventId cuando cambie el evento
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      eventId: event._id,
    }));
  }, [event._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (formData.amount > event.balance) {
      toast.error(`El monto no puede exceder el saldo pendiente ($${event.balance.toFixed(2)})`);
      return;
    }

    try {
      setLoading(true);
      await eventPaymentsService.createEventPayment(formData);
      toast.success("Pago registrado exitosamente");
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      eventId: event._id,
      amount: 0,
      paymentMethod: "",
      notes: "",
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="md" centered backdrop="static">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Registrar Pago</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <Alert variant="info" className="mb-3">
            <div className="d-flex justify-content-between">
              <span>
                <strong>Evento:</strong> Folio #{event.folio}
              </span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span>
                <strong>Cliente:</strong> {event.client.name} {event.client.lastName}
              </span>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span>
                <strong>Total del Evento:</strong>
              </span>
              <span className="fw-bold">
                ${event.totalAmount.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span>
                <strong>Total Pagado:</strong>
              </span>
              <span className="fw-bold text-success">
                ${event.totalPaid.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span>
                <strong>Saldo Pendiente:</strong>
              </span>
              <span className="fw-bold text-danger">
                ${event.balance.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </Alert>

          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Monto del Pago <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={event.balance}
                  placeholder="0.00"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
                <Form.Text className="text-muted">
                  Máximo: ${event.balance.toFixed(2)}
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Método de Pago <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                >
                  <option value="">Seleccionar método de pago...</option>
                  {paymentMethods.map((method) => (
                    <option key={method._id} value={method._id}>
                      {method.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Notas (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Notas adicionales sobre el pago..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="light"
            onClick={handleClose}
            disabled={loading}
            style={{ borderRadius: "10px" }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "10px",
              minWidth: "120px",
            }}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Registrar Pago"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddEventPaymentModal;
