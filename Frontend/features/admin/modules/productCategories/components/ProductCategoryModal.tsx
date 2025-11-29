"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { productCategorySchema, ProductCategoryFormData } from "../schemas/productCategorySchema";
import { productCategoriesService } from "../services/productCategories";
import { ProductCategory } from "../types";

interface ProductCategoryModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  category?: ProductCategory | null;
}

const ProductCategoryModal: React.FC<ProductCategoryModalProps> = ({
  show,
  onHide,
  onSuccess,
  category,
}) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductCategoryFormData>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (show) {
      if (category) {
        reset({
          name: category.name,
          description: category.description || "",
        });
      } else {
        reset({
          name: "",
          description: "",
        });
      }
    }
  }, [show, category, reset]);

  const onSubmit = async (data: ProductCategoryFormData) => {
    try {
      setLoading(true);

      if (category) {
        await productCategoriesService.updateProductCategory(category._id, data);
        toast.success("Categoría actualizada exitosamente");
      } else {
        await productCategoriesService.createProductCategory(data);
        toast.success("Categoría creada exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la categoría");
      console.error("Error saving category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div>
          <Modal.Title className="fw-bold">
            {category ? "Editar Categoría de Producto" : "Nueva Categoría de Producto"}
          </Modal.Title>
          <p className="text-muted mb-0 small">
            {category
              ? "Actualiza la información de la categoría"
              : "Completa los datos de la nueva categoría"}
          </p>
        </div>
        <Button
          variant="link"
          onClick={onHide}
          className="text-muted p-0"
          style={{ fontSize: "1.5rem" }}
        >
          <X size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="pt-3">
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="g-3">
            {/* Nombre */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Nombre de la Categoría <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ej: Flores Naturales, Arreglos Florales, Plantas"
                      isInvalid={!!errors.name}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.name && (
                  <Form.Control.Feedback type="invalid">
                    {errors.name.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Descripción */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Descripción (Opcional)</Form.Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      as="textarea"
                      rows={3}
                      placeholder="Describe la categoría de productos..."
                      isInvalid={!!errors.description}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                />
                {errors.description && (
                  <Form.Control.Feedback type="invalid">
                    {errors.description.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              variant="light"
              onClick={onHide}
              disabled={loading}
              style={{ borderRadius: "8px" }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              style={{
                borderRadius: "8px",
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
              ) : category ? (
                "Actualizar Categoría"
              ) : (
                "Crear Categoría"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ProductCategoryModal;
