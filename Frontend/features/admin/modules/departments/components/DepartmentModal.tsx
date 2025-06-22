import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Department, DepartmentFormData } from "../types";
import { departmentSchema } from "../schemas/departmentSchema";
import { createDepartment, updateDepartment } from "../services/departments";
import { getModalButtonStyles } from "@/utils/modalButtonStyles";

interface DepartmentModalProps {
  mode: "create" | "edit";
  editingDepartment?: Department;
  onDepartmentSaved: () => void;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  mode,
  onDepartmentSaved,
  editingDepartment = null,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isEditing = mode === "edit";

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (showModal) {
      if (isEditing && editingDepartment) {
        reset({
          name: editingDepartment.name,
        });
      } else {
        reset({
          name: "",
        });
      }
    }
  }, [showModal, isEditing, editingDepartment, reset]);

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      const response = isEditing
        ? await updateDepartment(editingDepartment!._id, data)
        : await createDepartment(data);

      if (response.success) {
        toast.success(
          `Departamento ${isEditing ? "actualizado" : "creado"} exitosamente`
        );
        onDepartmentSaved();
        handleClose();
      } else {
        toast.error(
          response.message ||
          `Error al ${isEditing ? "actualizar" : "crear"} el departamento`
        );
      }
    } catch (error: any) {
      toast.error(
        `Error al ${isEditing ? "actualizar" : "crear"} el departamento`
      );
      console.error("Error saving department:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    reset();
  };

  const buttonStyles = getModalButtonStyles("Departamento");
  const currentButtonConfig = buttonStyles[mode];
  const finalButtonProps = { ...currentButtonConfig, ...buttonProps };

  return (
    <>
      <Button
        variant={finalButtonProps.variant}
        size={finalButtonProps.size}
        className={finalButtonProps.className}
        onClick={() => setShowModal(true)}
        title={finalButtonProps.title}
      >
        {finalButtonProps.children}
      </Button>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Departamento" : "Nuevo Departamento"}
          </Modal.Title>
        </Modal.Header>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    {...field}
                    type="text"
                    placeholder="Nombre del departamento"
                    isInvalid={!!errors.name}
                  />
                )}
              />
              {errors.name && (
                <Form.Control.Feedback type="invalid">
                  {errors.name.message}
                </Form.Control.Feedback>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
};

export default DepartmentModal; 