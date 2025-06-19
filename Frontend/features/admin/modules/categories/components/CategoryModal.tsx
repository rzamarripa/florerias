import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getModalButtonStyles } from "../../../../../utils/modalButtonStyles";
import { CategoryFormData, categorySchema } from "../schemas/categorySchema";
import { categoryService } from "../services/categories";

interface CategoryLegacy {
  _id: string;
  nombre: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

interface ExtendedCategoryFormData extends CategoryFormData {
  status?: boolean;
}

interface CategoryModalProps {
  mode: "create" | "edit";
  onCategoriaSaved?: () => void;
  editingCategoria?: CategoryLegacy | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  mode,
  onCategoriaSaved,
  editingCategoria = null,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isEditing = mode === "edit";

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ExtendedCategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (showModal) {
      if (isEditing && editingCategoria) {
        setValue("name", editingCategoria.nombre);
        setValue("description", editingCategoria.description || "");
      } else {
        reset({
          name: "",
          description: "",
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

  const onSubmit = async (data: ExtendedCategoryFormData) => {
    try {
      const categoryData: CategoryFormData = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
      };

      let response;
      if (isEditing && editingCategoria) {
        response = await categoryService.update(
          editingCategoria._id,
          categoryData
        );
      } else {
        response = await categoryService.create(categoryData);
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
      console.error("Error in category operation:", error);

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
                Ejemplo: Electrónicos, Ropa, Hogar & Jardín, etc.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Descripción de la categoría (opcional)"
                    isInvalid={!!errors.description}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Máximo 200 caracteres
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="light"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="fw-medium px-4"
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

export default CategoryModal;
