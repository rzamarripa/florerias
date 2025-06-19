import { getModalButtonStyles } from "@/utils/modalButtonStyles";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  ExpenseConceptCategoryFormData,
  expenseConceptCategorySchema,
} from "../schemas/expenseConceptCategorySchema";
import { expenseConceptCategoryService } from "../services/expenseConceptCategories";
import { ExpenseConceptCategory } from "../types";

interface ExtendedExpenseConceptCategoryFormData
  extends ExpenseConceptCategoryFormData {
  status?: boolean;
}

interface ExpenseConceptCategoryModalProps {
  mode: "create" | "edit";
  onCategoriaSaved?: () => void;
  editingCategoria?: ExpenseConceptCategory | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const ExpenseConceptCategoryModal: React.FC<
  ExpenseConceptCategoryModalProps
> = ({ mode, onCategoriaSaved, editingCategoria = null, buttonProps = {} }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isEditing = mode === "edit";

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ExtendedExpenseConceptCategoryFormData>({
    resolver: zodResolver(expenseConceptCategorySchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (showModal) {
      if (isEditing && editingCategoria) {
        setValue("name", editingCategoria.name);
      } else {
        reset({
          name: "",
        });
      }
    }
  }, [showModal, isEditing, editingCategoria, setValue, reset]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: ExtendedExpenseConceptCategoryFormData) => {
    try {
      const categoryData: ExpenseConceptCategoryFormData = {
        name: data.name.trim(),
      };

      let response;
      if (isEditing && editingCategoria) {
        response = await expenseConceptCategoryService.update(
          editingCategoria._id,
          categoryData
        );
      } else {
        response = await expenseConceptCategoryService.create(categoryData);
      }

      if (response.success) {
        const action = isEditing ? "actualizada" : "creada";
        toast.success(
          `Categoría "${categoryData.name}" ${action} exitosamente`
        );
        onCategoriaSaved?.();
        handleCloseModal();
      } else {
        const errorMessage =
          response.message ||
          `Error al ${isEditing ? "actualizar" : "crear"} la categoría`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      let errorMessage = `Error al ${
        isEditing ? "actualizar" : "crear"
      } la categoría`;
      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          "Ya existe una categoría con ese nombre";
      } else if (error.response?.status === 404) {
        errorMessage = "Categoría no encontrada";
      } else if (error.response?.status >= 500) {
        errorMessage = "Error interno del servidor. Intenta nuevamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  const defaultButtonProps = getModalButtonStyles("Categoría");
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
        disabled={isEditing && !editingCategoria}
      >
        {finalButtonProps.children}
      </Button>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Categoría" : "Nueva Categoría"}
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
                    placeholder="Nombre de la categoría"
                    isInvalid={!!errors.name}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Ejemplo: Gastos de viaje, Gastos administrativos, etc.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
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
                  ></span>
                  {isEditing ? "Actualizando..." : "Guardando..."}
                </>
              ) : isEditing ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default ExpenseConceptCategoryModal;
