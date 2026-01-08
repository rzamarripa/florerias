"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { expenseConceptSchema, ExpenseConceptFormData } from "../schemas/expenseConceptSchema";
import { expenseConceptsService } from "../services/expenseConcepts";
import { ExpenseConcept } from "../types";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";

interface ExpenseConceptModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  concept?: ExpenseConcept | null;
}

const DEPARTMENT_OPTIONS = [
  { value: "sales", label: "Ventas" },
  { value: "administration", label: "Administración" },
  { value: "operations", label: "Operaciones" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finanzas" },
  { value: "human_resources", label: "Recursos Humanos" },
  { value: "other", label: "Otro" },
];

const ExpenseConceptModal: React.FC<ExpenseConceptModalProps> = ({
  show,
  onHide,
  onSuccess,
  concept,
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const isGerente = user?.role?.name === "Gerente";

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseConceptFormData>({
    resolver: zodResolver(expenseConceptSchema),
    defaultValues: {
      name: "",
      description: "",
      department: "sales",
    },
  });

  // Reset del formulario cuando se abre el modal

  useEffect(() => {
    if (show) {
      if (concept) {
        reset({
          name: concept.name,
          description: concept.description || "",
          department: concept.department,
        });
      } else {
        reset({
          name: "",
          description: "",
          department: "sales",
        });
      }
    }
  }, [show, concept, reset]);

  const onSubmit = async (data: ExpenseConceptFormData) => {
    try {
      setLoading(true);

      // Determinar la sucursal según el rol
      let finalData = { ...data };
      
      if (!concept) {
        // Para nuevos conceptos, determinar la sucursal
        if (isGerente) {
          // Para Gerente, el backend obtendrá la sucursal automáticamente
          // Enviamos un string vacío o no enviamos nada
          delete finalData.branch;
        } else if (activeBranch) {
          // Para Administrador, usar la sucursal activa
          finalData.branch = activeBranch._id;
        } else {
          // Solo mostrar error si es Administrador sin sucursal
          toast.error("Por favor selecciona una sucursal");
          setLoading(false);
          return;
        }
      }

      if (concept) {
        // En edición no se envía branch
        const { branch, ...updateData } = finalData;
        await expenseConceptsService.updateExpenseConcept(concept._id, updateData);
        toast.success("Concepto actualizado exitosamente");
      } else {
        await expenseConceptsService.createExpenseConcept(finalData);
        toast.success("Concepto creado exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el concepto");
      console.error("Error saving concept:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div>
          <Modal.Title className="fw-bold">
            {concept ? "Editar Concepto de Gasto" : "Nuevo Concepto de Gasto"}
          </Modal.Title>
          <p className="text-muted mb-0 small">
            {concept
              ? "Actualiza la información del concepto"
              : "Completa los datos del nuevo concepto"}
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
                  Nombre del Concepto <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ej: Renta de local, Electricidad, Papelería"
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

            {/* Departamento */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Departamento <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors.department}
                      style={{ borderRadius: "8px" }}
                    >
                      {DEPARTMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                {errors.department && (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {errors.department.message}
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
                      placeholder="Describe el concepto de gasto..."
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
              ) : concept ? (
                "Actualizar Concepto"
              ) : (
                "Crear Concepto"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ExpenseConceptModal;
