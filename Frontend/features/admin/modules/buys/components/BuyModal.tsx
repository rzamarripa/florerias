"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { buysService } from "../services/buys";
import { Buy, CreateBuyData } from "../types";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { PaymentMethod } from "../../payment-methods/types";

interface BuyModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  buy?: Buy;
}

const BuyModal: React.FC<BuyModalProps> = ({ show, onHide, onSuccess, buy }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [formData, setFormData] = useState<CreateBuyData>({
    paymentDate: new Date().toISOString().split("T")[0],
    concept: "",
    amount: 0,
    paymentMethod: "",
    description: "",
  });

  const isEditing = !!buy;

  // Cargar métodos de pago
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await paymentMethodsService.getAllPaymentMethods({
          status: true,
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

  // Cargar datos del buy si está editando
  useEffect(() => {
    if (buy) {
      setFormData({
        paymentDate: buy.paymentDate.split("T")[0],
        concept: buy.concept,
        amount: buy.amount,
        paymentMethod: typeof buy.paymentMethod === "string"
          ? buy.paymentMethod
          : buy.paymentMethod._id,
        description: buy.description || "",
      });
    } else {
      setFormData({
        paymentDate: new Date().toISOString().split("T")[0],
        concept: "",
        amount: 0,
        paymentMethod: "",
        description: "",
      });
    }
  }, [buy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.concept.trim()) {
      toast.error("El concepto es obligatorio");
      return;
    }

    if (!formData.paymentMethod) {
      toast.error("Selecciona una forma de pago");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("El importe debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);

      if (isEditing && buy) {
        await buysService.updateBuy(buy._id, formData);
        toast.success("Compra actualizada exitosamente");
      } else {
        await buysService.createBuy(formData);
        toast.success("Compra creada exitosamente");
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la compra");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      paymentDate: new Date().toISOString().split("T")[0],
      concept: "",
      amount: 0,
      paymentMethod: "",
      description: "",
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">
          {isEditing ? "Editar Compra" : "Nueva Compra"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Fecha de Pago <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Forma de Pago <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                >
                  <option value="">Seleccionar...</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm._id} value={pm._id}>
                      {pm.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Concepto <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej: COMPRA DE FLORES"
                  value={formData.concept}
                  onChange={(e) =>
                    setFormData({ ...formData, concept: e.target.value.toUpperCase() })
                  }
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Importe <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Descripción adicional de la compra..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default BuyModal;
