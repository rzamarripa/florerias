"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { ChromePicker, ColorResult } from "react-color";
import { stageCatalogSchema, StageCatalogFormData } from "../schemas/stageCatalogSchema";
import { stageCatalogsService } from "../services/stageCatalogs";
import { StageCatalog, RGBColor } from "../types";

interface StageCatalogModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  stage?: StageCatalog | null;
}

const StageCatalogModal: React.FC<StageCatalogModalProps> = ({
  show,
  onHide,
  onSuccess,
  stage,
}) => {
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StageCatalogFormData>({
    resolver: zodResolver(stageCatalogSchema),
    defaultValues: {
      name: "",
      abreviation: "",
      stageNumber: 1,
      boardType: "Produccion" as "Produccion" | "Envio",
      color: { r: 102, g: 126, b: 234, a: 1 }, // Color por defecto (púrpura)
    },
  });

  const currentColor = watch("color");

  useEffect(() => {
    if (show) {
      if (stage) {
        reset({
          name: stage.name,
          abreviation: stage.abreviation,
          stageNumber: stage.stageNumber,
          boardType: stage.boardType,
          color: stage.color,
        });
      } else {
        reset({
          name: "",
          abreviation: "",
          stageNumber: 1,
          boardType: "Produccion" as "Produccion" | "Envio",
          color: { r: 102, g: 126, b: 234, a: 1 },
        });
      }
    }
  }, [show, stage, reset]);

  const handleColorChange = (color: ColorResult) => {
    setValue("color", {
      r: color.rgb.r,
      g: color.rgb.g,
      b: color.rgb.b,
      a: color.rgb.a || 1,
    });
  };

  const onSubmit = async (data: StageCatalogFormData) => {
    try {
      setLoading(true);

      if (stage) {
        await stageCatalogsService.updateStageCatalog(stage._id, {
          name: data.name,
          abreviation: data.abreviation,
          stageNumber: data.stageNumber,
          boardType: data.boardType,
          color: data.color,
        });
        toast.success("Etapa actualizada exitosamente");
      } else {
        await stageCatalogsService.createStageCatalog(data);
        toast.success("Etapa creada exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la etapa");
      console.error("Error saving stage:", error);
    } finally {
      setLoading(false);
    }
  };

  const rgbaToString = (color: RGBColor): string => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div>
          <Modal.Title className="fw-bold">
            {stage ? "Editar Etapa" : "Nueva Etapa"}
          </Modal.Title>
          <p className="text-muted mb-0 small">
            {stage
              ? "Actualiza la información de la etapa"
              : "Completa los datos de la nueva etapa"}
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
                  Nombre de la Etapa <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ej: En Proceso, Completado, Pendiente"
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

            {/* Abreviación */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Abreviación <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="abreviation"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ej: EP, COM, PEN"
                      isInvalid={!!errors.abreviation}
                      style={{ borderRadius: "8px", textTransform: "uppercase" }}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                {errors.abreviation && (
                  <Form.Control.Feedback type="invalid">
                    {errors.abreviation.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Número de Etapa */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Número de Etapa <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="stageNumber"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      min="1"
                      placeholder="Ej: 1, 2, 3"
                      isInvalid={!!errors.stageNumber}
                      style={{ borderRadius: "8px" }}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  )}
                />
                {errors.stageNumber && (
                  <Form.Control.Feedback type="invalid">
                    {errors.stageNumber.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Tipo de Tablero */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Tipo de Tablero <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="boardType"
                  control={control}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors.boardType}
                      style={{ borderRadius: "8px" }}
                    >
                      <option value="Produccion">Producción</option>
                      <option value="Envio">Envío</option>
                    </Form.Select>
                  )}
                />
                {errors.boardType && (
                  <Form.Control.Feedback type="invalid">
                    {errors.boardType.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Color */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Color <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <div
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="d-flex align-items-center gap-3 p-3 border rounded"
                    style={{
                      cursor: "pointer",
                      borderRadius: "8px",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: currentColor ? rgbaToString(currentColor) : "var(--bs-primary)",
                        border: "2px solid #dee2e6",
                      }}
                    />
                    <div>
                      <div className="fw-semibold">
                        {currentColor
                          ? `RGB(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
                          : "Selecciona un color"}
                      </div>
                      <small className="text-muted">
                        Haz clic para cambiar el color
                      </small>
                    </div>
                  </div>

                  {showColorPicker && (
                    <div
                      className="position-absolute mt-2"
                      style={{ zIndex: 1000 }}
                    >
                      <div
                        className="position-fixed top-0 start-0 w-100 h-100"
                        onClick={() => setShowColorPicker(false)}
                        style={{ zIndex: 999 }}
                      />
                      <div style={{ position: "relative", zIndex: 1000 }}>
                        <ChromePicker
                          color={currentColor}
                          onChange={handleColorChange}
                          disableAlpha={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {errors.color && (
                  <Form.Text className="text-danger">
                    {errors.color.message}
                  </Form.Text>
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
              ) : stage ? (
                "Actualizar Etapa"
              ) : (
                "Crear Etapa"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default StageCatalogModal;
