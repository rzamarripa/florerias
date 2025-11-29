"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { neighborhoodsService } from "../services/neighborhoods";
import { Neighborhood, CreateNeighborhoodData, UpdateNeighborhoodData } from "../types";
import { toast } from "react-toastify";

interface NeighborhoodModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  neighborhood?: Neighborhood | null;
}

const NeighborhoodModal: React.FC<NeighborhoodModalProps> = ({
  show,
  onHide,
  onSuccess,
  neighborhood,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    priceDelivery: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (neighborhood) {
      setFormData({
        name: neighborhood.name,
        priceDelivery: neighborhood.priceDelivery.toString(),
        status: neighborhood.status,
      });
    } else {
      setFormData({
        name: "",
        priceDelivery: "",
        status: "active",
      });
    }
  }, [neighborhood, show]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.priceDelivery) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const priceValue = parseFloat(formData.priceDelivery);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error("El precio de entrega debe ser un número mayor o igual a 0");
      return;
    }

    try {
      setLoading(true);

      if (neighborhood) {
        // Actualizar colonia existente
        const updateData: UpdateNeighborhoodData = {
          name: formData.name,
          priceDelivery: priceValue,
          status: formData.status,
        };

        const response = await neighborhoodsService.updateNeighborhood(
          neighborhood._id,
          updateData
        );

        if (response.success) {
          toast.success("Colonia actualizada exitosamente");
          onSuccess();
          onHide();
        }
      } else {
        // Crear nueva colonia
        const createData: CreateNeighborhoodData = {
          name: formData.name,
          priceDelivery: priceValue,
          status: formData.status,
        };

        const response = await neighborhoodsService.createNeighborhood(createData);

        if (response.success) {
          toast.success("Colonia creada exitosamente");
          onSuccess();
          onHide();
        }
      }
    } catch (error: any) {
      console.error("Error al guardar colonia:", error);
      toast.error(
        error?.message || "Error al guardar la colonia. Por favor intenta de nuevo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={!loading}
    >
      <Modal.Header
        closeButton
        className="bg-primary text-white"
        style={{
          border: "none",
          borderTopLeftRadius: "var(--bs-modal-inner-border-radius)",
          borderTopRightRadius: "var(--bs-modal-inner-border-radius)",
        }}
      >
        <Modal.Title className="fw-bold">
          {neighborhood ? "Editar Colonia" : "Nueva Colonia"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          <div className="row g-3">
            {/* Nombre de la Colonia */}
            <div className="col-12">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Nombre de la Colonia <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Centro, Jardines de la Paz, etc."
                  required
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                  }}
                />
              </Form.Group>
            </div>

            {/* Precio de Entrega */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Precio de Entrega <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="priceDelivery"
                  value={formData.priceDelivery}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                  }}
                />
                <Form.Text className="text-muted">
                  Costo de entrega para esta colonia
                </Form.Text>
              </Form.Group>
            </div>

            {/* Estatus */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Estatus <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  style={{
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                  }}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Solo las colonias activas estarán disponibles para entregas
                </Form.Text>
              </Form.Group>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer
          style={{
            borderTop: "2px solid #f1f3f5",
            padding: "1rem 1.5rem",
          }}
        >
          <Button
            variant="light"
            onClick={onHide}
            disabled={loading}
            style={{
              borderRadius: "8px",
              padding: "8px 20px",
              fontWeight: "600",
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{
              borderRadius: "8px",
              padding: "8px 20px",
              fontWeight: "600",
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
            ) : neighborhood ? (
              "Actualizar Colonia"
            ) : (
              "Crear Colonia"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NeighborhoodModal;
