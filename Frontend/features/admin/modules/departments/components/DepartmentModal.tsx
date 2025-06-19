import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Department, DepartmentFormData } from "../types";
import { departmentSchema } from "../schemas/departmentSchema";
import { createDepartment, updateDepartment } from "../services/departments";
import { brandsService } from "../../brands/services/brands";
import { Brand } from "../../brands/types";
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(false);
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
      brandId: "",
    },
  });

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await brandsService.getAll();
      if (response.success) {
        setBrands(response.data.filter(brand => brand.isActive));
      } else {
        toast.error("Error al cargar las marcas");
      }
    } catch (error: any) {
      toast.error("Error al cargar las marcas");
      console.error("Error loading brands:", error);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadBrands();
      if (isEditing && editingDepartment) {
        reset({
          name: editingDepartment.name,
          brandId: editingDepartment.brandId._id,
        });
      } else {
        reset({
          name: "",
          brandId: "",
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
              <Form.Label>Marca</Form.Label>
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <Form.Select
                    {...field}
                    isInvalid={!!errors.brandId}
                    disabled={loadingBrands}
                  >
                    <option value="">Seleccionar marca</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              {errors.brandId && (
                <Form.Control.Feedback type="invalid">
                  {errors.brandId.message}
                </Form.Control.Feedback>
              )}
            </div>

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