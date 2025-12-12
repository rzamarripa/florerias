"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { Sale } from "../types";
import { salesService } from "../services/sales";

interface EditSaleModalProps {
  show: boolean;
  onHide: () => void;
  sale: Sale;
  onSaleUpdated: () => void;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({
  show,
  onHide,
  sale,
  onSaleUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryMessage: "",
    deliveryDateTime: "",
  });

  // Inicializar datos del formulario cuando se abre el modal
  useEffect(() => {
    if (show && sale) {
      const deliveryDate = sale.deliveryData?.deliveryDateTime
        ? new Date(sale.deliveryData.deliveryDateTime).toISOString().slice(0, 16)
        : "";

      setFormData({
        deliveryMessage: sale.deliveryData?.message || "",
        deliveryDateTime: deliveryDate,
      });
    }
  }, [show, sale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.deliveryDateTime) {
      toast.error("La fecha de entrega es obligatoria");
      return;
    }

    try {
      setLoading(true);

      await salesService.updateSaleDeliveryInfo(sale._id, {
        message: formData.deliveryMessage,
        deliveryDateTime: formData.deliveryDateTime,
      });

      toast.success("Información de entrega actualizada exitosamente");
      onSaleUpdated();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la venta");
      console.error("Error updating sale:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <div className="d-flex align-items-center gap-2">
            <span>Editar Venta - {sale.orderNumber}</span>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <div className="bg-light p-3 rounded mb-4">
              <h6 className="fw-semibold mb-2">Información del Cliente</h6>
              <p className="mb-1">
                <strong>Cliente:</strong> {sale.clientInfo?.name || "N/A"}
              </p>
              {sale.clientInfo?.phone && (
                <p className="mb-1">
                  <strong>Teléfono:</strong> {sale.clientInfo.phone}
                </p>
              )}
              <p className="mb-0">
                <strong>Total:</strong> ${sale.total.toFixed(2)}
              </p>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Fecha y Hora de Entrega <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="datetime-local"
                value={formData.deliveryDateTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryDateTime: e.target.value })
                }
                required
              />
              <Form.Text className="text-muted">
                Actualiza la fecha y hora de entrega del pedido
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Comentarios / Mensaje de Entrega
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.deliveryMessage}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryMessage: e.target.value })
                }
                placeholder="Escribe instrucciones especiales, comentarios sobre la entrega, etc."
              />
              <Form.Text className="text-muted">
                Instrucciones especiales o comentarios para la entrega
              </Form.Text>
            </Form.Group>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
            }}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditSaleModal;
