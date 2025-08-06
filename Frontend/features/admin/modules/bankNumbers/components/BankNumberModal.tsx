import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getModalButtonStyles } from "../../../../../utils/modalButtonStyles";
import {
  bankNumberSchema,
  BankNumberFormData,
} from "../schemas/bankNumberSchema";
import { BankNumber, Bank } from "../types";
import {
  getBanksForSelect,
  createBankNumber,
  updateBankNumber,
} from "../services/bankNumbers";

interface BankNumberModalProps {
  mode: "create" | "edit";
  onBankNumberSaved?: () => void;
  editingBankNumber?: BankNumber | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const BankNumberModal: React.FC<BankNumberModalProps> = ({
  mode,
  onBankNumberSaved,
  editingBankNumber = null,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isEditing = mode === "edit";

  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BankNumberFormData>({
    resolver: zodResolver(bankNumberSchema) as any,
    defaultValues: {
      bankDebited: "",
      bankCredited: "",
      bankNumber: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (showModal) {
      setLoadingBanks(true);

      getBanksForSelect()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setBanks(res.data);
          }
        })
        .finally(() => setLoadingBanks(false));

      if (isEditing && editingBankNumber) {
        setValue("bankDebited", editingBankNumber.bankDebited._id);
        setValue("bankCredited", editingBankNumber.bankCredited);
        setValue("bankNumber", editingBankNumber.bankNumber);
      } else {
        reset();
      }
    }
  }, [showModal, isEditing, editingBankNumber, setValue, reset]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEditing && editingBankNumber) {
        const res = await updateBankNumber(editingBankNumber._id, data);
        if (res.success) {
          toast.success("Número de banco actualizado exitosamente");
          onBankNumberSaved?.();
          handleCloseModal();
        } else {
          toast.error(res.message || "Error al actualizar número de banco");
        }
      } else {
        const res = await createBankNumber(data);
        if (res.success) {
          toast.success("Número de banco creado exitosamente");
          onBankNumberSaved?.();
          handleCloseModal();
        } else {
          toast.error(res.message || "Error al crear número de banco");
        }
      }
    } catch (error) {
      const action = isEditing ? "actualizar" : "crear";
      toast.error(`Error al ${action} el número de banco`);
      console.error(`Error ${action} número de banco:`, error);
    }
  });

  const buttonStyles = getModalButtonStyles("Número de Banco");
  const currentButtonConfig = buttonStyles[mode];
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
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar número de banco" : "Nuevo número de banco"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <Controller
                  name="bankDebited"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Banco de cuenta de cargo *</Form.Label>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.bankDebited}
                        disabled={loadingBanks}
                      >
                        <option value="">Seleccionar banco</option>
                        {banks.map((bank) => (
                          <option key={bank._id} value={bank._id}>
                            {bank.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.bankDebited?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-12">
                <Controller
                  name="bankCredited"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Banco de cuenta de abono *</Form.Label>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.bankCredited}
                        disabled={loadingBanks}
                      >
                        <option value="">Seleccionar banco</option>
                        {banks.map((bank) => (
                          <option key={bank._id} value={bank.name}>
                            {bank.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.bankCredited?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-12">
                <Controller
                  name="bankNumber"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Número de banco *</Form.Label>
                      <Form.Control
                        {...field}
                        isInvalid={!!errors.bankNumber}
                        placeholder="5 dígitos"
                        maxLength={5}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.bankNumber?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            onClick={handleCloseModal}
            className="fw-medium px-4"
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={isSubmitting}>
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
      </Modal>
    </>
  );
};

export default BankNumberModal;
