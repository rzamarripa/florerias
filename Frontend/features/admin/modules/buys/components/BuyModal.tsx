"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { buysService } from "../services/buys";
import { Buy, CreateBuyData } from "../types";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { PaymentMethod } from "../../payment-methods/types";
import { providersService } from "../../providers/services/providers";
import { Provider } from "../../providers/types";
import { expenseConceptsService } from "../../expenseConcepts/services/expenseConcepts";
import { ExpenseConcept } from "../../expenseConcepts/types";

interface BuyModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  buy?: Buy;
}

const BuyModal: React.FC<BuyModalProps> = ({ show, onHide, onSuccess, buy }) => {
  const [loading, setLoading] = useState(false);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [expenseConcepts, setExpenseConcepts] = useState<ExpenseConcept[]>([]);
  const [formData, setFormData] = useState<CreateBuyData>({
    paymentDate: new Date().toISOString().split("T")[0],
    concept: "",
    amount: 0,
    paymentMethod: "",
    provider: "",
    description: "",
  });

  const isEditing = !!buy;

  // Cargar métodos de pago, proveedores y conceptos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingConcepts(true);
        const [paymentMethodsResponse, providersResponse, conceptsResponse] = await Promise.all([
          paymentMethodsService.getAllPaymentMethods({ status: true }),
          providersService.getAllProviders({ page: 1, limit: 1000, isActive: true }),
          expenseConceptsService.getAllExpenseConcepts({ isActive: true, limit: 1000 })
        ]);

        if (paymentMethodsResponse.data) {
          setPaymentMethods(paymentMethodsResponse.data);
        }

        if (providersResponse.data) {
          setProviders(providersResponse.data);
        }

        if (conceptsResponse.success) {
          setExpenseConcepts(conceptsResponse.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoadingConcepts(false);
      }
    };

    if (show) {
      loadData();
    }
  }, [show]);

  // Cargar datos del buy si está editando
  useEffect(() => {
    if (buy) {
      setFormData({
        paymentDate: buy.paymentDate.split("T")[0],
        concept: buy.concept?._id || "",
        amount: buy.amount,
        paymentMethod: typeof buy.paymentMethod === "string"
          ? buy.paymentMethod
          : buy.paymentMethod._id,
        provider: buy.provider ? (typeof buy.provider === "string" ? buy.provider : buy.provider._id) : "",
        description: buy.description || "",
      });
    } else {
      setFormData({
        paymentDate: new Date().toISOString().split("T")[0],
        concept: "",
        amount: 0,
        paymentMethod: "",
        provider: "",
        description: "",
      });
    }
  }, [buy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.concept) {
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
      provider: "",
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
                  Proveedor
                </Form.Label>
                <Form.Select
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                >
                  <option value="">Seleccionar proveedor (opcional)...</option>
                  {providers.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.tradeName} - {provider.rfc}
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
                <Form.Select
                  value={formData.concept}
                  onChange={(e) =>
                    setFormData({ ...formData, concept: e.target.value })
                  }
                  required
                  disabled={loadingConcepts}
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                >
                  <option value="">
                    {loadingConcepts ? "Cargando conceptos..." : "Seleccionar concepto..."}
                  </option>
                  {expenseConcepts.map((concept) => (
                    <option key={concept._id} value={concept._id}>
                      {concept.name}
                      {concept.description && ` - ${concept.description}`}
                    </option>
                  ))}
                </Form.Select>
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
