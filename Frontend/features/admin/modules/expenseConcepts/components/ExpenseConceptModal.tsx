"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { expenseConceptSchema, ExpenseConceptFormData } from "../schemas/expenseConceptSchema";
import { expenseConceptsService } from "../services/expenseConcepts";
import { branchesService } from "../../branches/services/branches";
import { ExpenseConcept } from "../types";

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
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

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
      branch: "",
    },
  });

  useEffect(() => {
    if (show) {
      loadBranches();
      if (concept) {
        reset({
          name: concept.name,
          description: concept.description || "",
          department: concept.department,
          branch: concept.branch._id,
        });
      } else {
        reset({
          name: "",
          description: "",
          department: "sales",
          branch: "",
        });
      }
    }
  }, [show, concept, reset]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      // El servicio getUserBranches ya filtra por rol (Administrador o Gerente)
      const response = await branchesService.getUserBranches();
      if (response.data) {
        setBranches(response.data);
      }
    } catch (error: any) {
      toast.error("Error al cargar las sucursales");
      console.error("Error loading branches:", error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const onSubmit = async (data: ExpenseConceptFormData) => {
    try {
      setLoading(true);

      if (concept) {
        await expenseConceptsService.updateExpenseConcept(concept._id, data);
        toast.success("Concepto actualizado exitosamente");
      } else {
        await expenseConceptsService.createExpenseConcept(data);
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
            {/* Sucursal */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Sucursal <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="branch"
                  control={control}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors.branch}
                      disabled={loadingBranches || !!concept}
                      style={{ borderRadius: "8px" }}
                    >
                      <option value="">Selecciona una sucursal</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.branchName} {branch.branchCode ? `- ${branch.branchCode}` : ""}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                {errors.branch && (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {errors.branch.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

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
