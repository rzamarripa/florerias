import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getModalButtonStyles } from "../../../../../utils/modalButtonStyles";
import { expenseConceptService } from "../services/expenseConcepts";
import { expenseConceptCategoryService } from "../../expenseConceptCategories/services/expenseConceptCategories";
import { ExpenseConceptCategory } from "../../expenseConceptCategories/types";
import { expenseConceptSchema } from "../schemas/expenseConceptSchema";
import { ExpenseConceptData, ExpenseConceptFormData } from "../types";
    
interface ExpenseConceptModalProps {
  mode: "create" | "edit";
  onConceptoSaved?: () => void;
  editingConcepto?: ExpenseConceptData | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const ExpenseConceptModal: React.FC<ExpenseConceptModalProps> = ({
  mode,
  onConceptoSaved,
  editingConcepto = null,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [categories, setCategories] = useState<ExpenseConceptCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const isEditing = mode === "edit";

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ExpenseConceptFormData>({
    resolver: zodResolver(expenseConceptSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
    },
    mode: "onChange",
  });

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await expenseConceptCategoryService.getAll({ isActive: "true" });
      if (response.success) {
        setCategories(response.data);
      } else {
        toast.error("Error al cargar las categorías");
      }
    } catch (error: any) {
      toast.error("Error al cargar las categorías");
      console.error("Error loading categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadCategories();
      if (isEditing && editingConcepto) {
        if ('nombre' in editingConcepto) {
          // Es un objeto legacy
          setValue("name", editingConcepto.nombre);
          setValue("description", editingConcepto.descripcion);
          // categoryId se debe obtener del backend o manejar de otra forma
        } else {
          // Es un objeto ExpenseConcept
          setValue("name", editingConcepto.name);
          setValue("description", editingConcepto.description);
          setValue("categoryId", editingConcepto.categoryId._id);
        }
      } else {
        reset({
          name: "",
          description: "",
          categoryId: "",
        });
      }
    }
  }, [showModal, isEditing, editingConcepto, setValue, reset]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: ExpenseConceptFormData) => {
    try {
      const conceptData: ExpenseConceptFormData = {
        name: data.name.trim(),
        description: data.description.trim(),
        categoryId: data.categoryId,
      };

      let response;
      if (isEditing && editingConcepto) {
        const id = editingConcepto._id;
        response = await expenseConceptService.update(id, conceptData);
      } else {
        response = await expenseConceptService.create(conceptData);
      }

      if (response.success) {
        const action = isEditing ? "actualizado" : "creado";
        toast.success(
          `Concepto de gasto "${conceptData.name}" ${action} exitosamente`
        );
        onConceptoSaved?.();
        handleCloseModal();
      } else {
        const errorMessage =
          response.message ||
          `Error al ${isEditing ? "actualizar" : "crear"} el concepto de gasto`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error in expense concept operation:", error);

      let errorMessage = `Error al ${
        isEditing ? "actualizar" : "crear"
      } el concepto de gasto`;

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Ya existe un concepto de gasto con ese nombre en esta categoría";
      } else if (error.response?.status === 404) {
        errorMessage = "Concepto de gasto no encontrado";
      } else if (error.response?.status >= 500) {
        errorMessage = "Error interno del servidor. Intenta nuevamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const defaultButtonProps = getModalButtonStyles("Concepto de Gasto");
  const currentButtonConfig = defaultButtonProps[mode];
  const finalButtonProps = { ...currentButtonConfig, ...buttonProps };

  return (
    <>
      <Button
        variant={finalButtonProps.variant}
        size={finalButtonProps.size}
        className={finalButtonProps.className}
        title={finalButtonProps.title}
        onClick={handleOpenModal}
        disabled={isEditing && !editingConcepto}
      >
        {finalButtonProps.children}
      </Button>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Concepto de Gasto" : "Nuevo Concepto de Gasto"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Nombre <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Nombre del concepto de gasto"
                    isInvalid={!!errors.name}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Ejemplo: Combustible, Material de oficina, Servicios públicos, etc.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Descripción <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Descripción detallada del concepto de gasto"
                    isInvalid={!!errors.description}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Describe el propósito y alcance de este concepto de gasto.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Categoría <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Form.Select
                    isInvalid={!!errors.categoryId}
                    disabled={loadingCategories}
                    {...field}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.categoryId?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Selecciona la categoría a la que pertenece este concepto de gasto.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  {isEditing ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>{isEditing ? "Actualizar" : "Crear"}</>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default ExpenseConceptModal; 