import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getModalButtonStyles } from "../../../../../utils/modalButtonStyles";
import { BankFormData, bankSchema } from "../schemas/bankSchema";
import { banksService } from "../services/banks";
import { Bank } from "../types";

interface BankModalProps {
  mode: "create" | "edit";
  onBankSaved?: () => void;
  editingBank?: Bank | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const BankModal: React.FC<BankModalProps> = ({
  mode,
  onBankSaved,
  editingBank = null,
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
  } = useForm<BankFormData>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (showModal) {
      if (isEditing && editingBank) {
        setValue("name", editingBank.name);
      } else {
        reset({
          name: "",
        });
      }
    }
  }, [showModal, isEditing, editingBank, setValue, reset]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: BankFormData) => {
    try {
      const bankData: BankFormData = {
        name: data.name.trim(),
      };

      let response;
      if (isEditing && editingBank) {
        response = await banksService.update(editingBank._id, bankData);
      } else {
        response = await banksService.create(bankData);
      }

      if (response.success) {
        const action = isEditing ? "actualizado" : "creado";
        toast.success(`Banco "${bankData.name}" ${action} exitosamente`);
        onBankSaved?.();
        handleCloseModal();
      } else {
        const errorMessage =
          response.message ||
          `Error al ${isEditing ? "actualizar" : "crear"} el banco`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error in bank operation:", error);
      let errorMessage = `Error al ${
        isEditing ? "actualizar" : "crear"
      } el banco`;
      if (
        error.response?.status === 400 &&
        error.response.data?.message?.toLowerCase().includes("already exists")
      ) {
        errorMessage =
          "Ya existe un banco con ese nombre (sin importar acentos o mayúsculas).";
      } else if (error.response?.status === 404) {
        errorMessage = "Banco no encontrado";
      } else if (error.response?.status >= 500) {
        errorMessage = "Error interno del servidor. Intenta nuevamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  const defaultButtonProps = getModalButtonStyles("Banco");
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
        disabled={isEditing && !editingBank}
      >
        {finalButtonProps.children}
      </Button>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Banco" : "Nuevo Banco"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Banco <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Nombre del banco"
                    isInvalid={!!errors.name}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name?.message}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Escribe el nombre del banco que deseas agregar al sistema
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

export default BankModal;
