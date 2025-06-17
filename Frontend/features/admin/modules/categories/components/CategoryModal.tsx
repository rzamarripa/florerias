import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { CategoryFormData, categorySchema } from "../schemas/categorySchema";

interface Categoria extends CategoryFormData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryModalProps {
  mode: "create" | "edit";
  onCategoriaSaved?: () => void;
  editingCategoria?: Categoria | null;
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
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: "",
      status: true,
    },
    mode: "onChange",
  });

  // Cargar datos cuando está editando
  useEffect(() => {
    if (showModal) {
      if (isEditing && editingCategoria) {
        // Cargar datos para edición
        setValue("nombre", editingCategoria.nombre);
        setValue("status", editingCategoria.status);
      } else {
        // Resetear para creación
        reset();
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

  const onSubmit = async (data: CategoryFormData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      if (isEditing && editingCategoria) {
        console.log("Updating categoria:", { ...editingCategoria, ...data });
        toast.success("Categoría actualizada exitosamente");
      } else {
        console.log("Creating categoria:", data);
        toast.success("Categoría creada exitosamente");
      }

      onCategoriaSaved?.();
      handleCloseModal();
    } catch (error) {
      const action = isEditing ? 'actualizar' : 'crear';
      const errorMessage = `Error al ${action} la categoría`;
      toast.error(errorMessage);
      console.error(`Error ${action} categoria:`, error);
    }
  };

  const defaultButtonProps = {
    create: {
      variant: "primary",
      className: "d-flex align-items-center gap-2 text-nowrap px-3",
      title: "Nueva Categoría",
      children: (
        <>
          <Plus size={18} />
          Nueva Categoría
        </>
      )
    },
    edit: {
      variant: "light",
      size: "sm" as const,
      className: "btn-icon rounded-circle",
      title: "Editar categoría",
      children: <BsPencil size={16} />
    }
  };

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
      >
        {finalButtonProps.children}
      </Button>

      <Modal show={showModal} onHide={handleCloseModal} size="md" centered>
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
                name="nombre"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Nombre de la categoría"
                    isInvalid={!!errors.nombre}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.nombre?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Ejemplo: Electrónicos, Ropa, Hogar & Jardín, etc.
              </Form.Text>
            </Form.Group>

            <div className="bg-light p-3 rounded">
              <small className="text-muted">
                <strong>Nota:</strong> La categoría será creada como activa por defecto. 
                Puedes cambiar su estado desde la tabla principal.
              </small>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
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
              ) : (
                isEditing ? "Actualizar" : "Guardar"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default CategoryModal;