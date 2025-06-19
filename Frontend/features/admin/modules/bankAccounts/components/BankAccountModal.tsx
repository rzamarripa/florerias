import { getModalButtonStyles } from "@/utils/modalButtonStyles";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { banksService } from "../../banks/services/banks";
import { companiesService } from "../../companies/services/companies";
import {
  BankAccountFormData,
  bankAccountSchema,
} from "../schemas/bankAccountSchema";
import { bankAccountsService } from "../services/bankAccounts";
import { BankAccount } from "../types";

interface BankAccountModalProps {
  mode: "create" | "edit";
  onBankAccountSaved?: () => void;
  editingBankAccount?: BankAccount | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
  defaultCompanyId?: string;
  show?: boolean;
  onClose?: () => void;
}

const BankAccountModal: React.FC<BankAccountModalProps> = ({
  mode,
  onBankAccountSaved,
  editingBankAccount = null,
  buttonProps = {},
  defaultCompanyId,
  show,
  onClose,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [banks, setBanks] = useState<{ _id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ _id: string; name: string }[]>(
    []
  );
  const isEditing = mode === "edit";
  const isControlled =
    typeof show === "boolean" && typeof onClose === "function";
  const modalVisible = isControlled ? show : showModal;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      company: "",
      bank: "",
      accountNumber: "",
      clabe: "",
      branch: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (modalVisible) {
      banksService.getAll({ limit: 100 }).then((res: any) => {
        if (res && Array.isArray(res.data)) setBanks(res.data);
      });
      companiesService.getAll({ limit: 100 }).then((res: any) => {
        if (res && Array.isArray(res.data)) setCompanies(res.data);
      });
      if (isEditing && editingBankAccount) {
        setValue("company", editingBankAccount.company._id);
        setValue("bank", editingBankAccount.bank._id);
        setValue("accountNumber", editingBankAccount.accountNumber);
        setValue("clabe", editingBankAccount.clabe);
        setValue("branch", editingBankAccount.branch || "");
      } else {
        reset({
          company: defaultCompanyId || "",
          bank: "",
          accountNumber: "",
          clabe: "",
          branch: "",
        });
      }
    }
  }, [
    modalVisible,
    isEditing,
    editingBankAccount,
    setValue,
    reset,
    defaultCompanyId,
  ]);

  const handleOpenModal = () => {
    if (!isControlled) {
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setShowModal(false);
      reset();
    }
  };

  const onSubmit = async (data: BankAccountFormData) => {
    try {
      const payload = {
        company: data.company,
        bank: data.bank,
        accountNumber: data.accountNumber.trim(),
        clabe: data.clabe.trim(),
        branch: data.branch?.trim() || "",
      };
      let response;
      if (isEditing && editingBankAccount) {
        response = await bankAccountsService.update(
          editingBankAccount._id,
          payload
        );
      } else {
        response = await bankAccountsService.create(payload);
      }
      if (response.success) {
        const action = isEditing ? "actualizada" : "creada";
        toast.success(`Cuenta bancaria ${action} exitosamente`);
        onBankAccountSaved?.();
        handleCloseModal();
      } else {
        const errorMessage =
          response.message ||
          `Error al ${isEditing ? "actualizar" : "crear"} la cuenta bancaria`;
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error in bank account operation:", error);
      let errorMessage = `Error al ${
        isEditing ? "actualizar" : "crear"
      } la cuenta bancaria`;
      if (
        error.response?.status === 400 &&
        error.response.data?.message?.toLowerCase().includes("already exists")
      ) {
        errorMessage = "Ya existe una cuenta bancaria con esos datos.";
      } else if (error.response?.status === 404) {
        errorMessage = "Cuenta bancaria no encontrada";
      } else if (error.response?.status >= 500) {
        errorMessage = "Error interno del servidor. Intenta nuevamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  const defaultButtonProps = getModalButtonStyles("Cuenta Bancaria");
  const currentButtonConfig = defaultButtonProps[mode];
  const finalButtonProps = { ...currentButtonConfig, ...buttonProps };

  return (
    <>
      {!isControlled && (
        <Button
          variant={finalButtonProps.variant}
          size={finalButtonProps.size}
          className={finalButtonProps.className}
          title={finalButtonProps.title}
          onClick={handleOpenModal}
          disabled={isEditing && !editingBankAccount}
        >
          {finalButtonProps.children}
        </Button>
      )}
      <Modal show={modalVisible} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Razón Social <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="company"
                control={control}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors.company}>
                    <option value="">Selecciona una razón social</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.company?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Banco <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="bank"
                control={control}
                render={({ field }) => (
                  <Form.Select {...field} isInvalid={!!errors.bank}>
                    <option value="">Selecciona un banco</option>
                    {banks.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </Form.Select>
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.bank?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Número de cuenta <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Número de cuenta"
                    isInvalid={!!errors.accountNumber}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.accountNumber?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Clabe interbancaria <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="clabe"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Clabe interbancaria"
                    isInvalid={!!errors.clabe}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.clabe?.message}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sucursal</Form.Label>
              <Controller
                name="branch"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Escriba el nombre de la sucursal del banco"
                    isInvalid={!!errors.branch}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.branch?.message}
              </Form.Control.Feedback>
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

export default BankAccountModal;
