import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { banksService } from "../../banks/services/banks";
import { Bank } from "../../banks/types";
import { companiesService } from "../../companies/services/companies";
import { Company } from "../../companies/types";
import { bankAccountsService } from "../services/bankAccounts";
import { BankAccount } from "../types";

interface BankAccountModalProps {
  mode: "create" | "edit";
  editingBankAccount?: BankAccount | null;
  onBankAccountSaved?: () => void;
  defaultCompanyId?: string;
  show?: boolean;
  onClose?: () => void;
}

const BankAccountModal: React.FC<BankAccountModalProps> = ({
  mode,
  editingBankAccount,

  onBankAccountSaved,
  defaultCompanyId,
  show,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [company, setCompany] = useState(defaultCompanyId || "");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [clabe, setClabe] = useState("");
  const [claveBanxico, setClaveBanxico] = useState("");
  const [branch, setBranch] = useState("");
  const [initialBalance, setInitialBalance] = useState<number | string>("");
  const [currentBalance, setCurrentBalance] = useState<number | string>("");

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(!!show);
    if (show) {
      companiesService.getAll({ limit: 1000 }).then((res: any) => {
        if (res.success) setCompanies(res.data);
      });
      banksService.getAll({ limit: 1000 }).then((res: any) => {
        if (res.success) setBanks(res.data);
      });

      if (mode === "edit" && editingBankAccount) {
        setCompany(editingBankAccount.company?._id || "");
        setBank(editingBankAccount.bank?._id || "");
        setAccountNumber(editingBankAccount.accountNumber || "");
        setClabe(editingBankAccount.clabe || "");
        setClaveBanxico(editingBankAccount.claveBanxico || "");
        setBranch(editingBankAccount.branch || "");
        setInitialBalance(editingBankAccount.initialBalance || 0);
        setCurrentBalance(editingBankAccount.currentBalance || 0);
      } else {
        resetForm();
        if (defaultCompanyId) setCompany(defaultCompanyId);
      }
    }
  }, [show, mode, editingBankAccount, defaultCompanyId]);

  const resetForm = () => {
    setCompany("");
    setBank("");
    setAccountNumber("");
    setClabe("");
    setClaveBanxico("");
    setBranch("");
    setInitialBalance("");
    setCurrentBalance("");
  };

  const handleClose = () => {
    setShowModal(false);
    onClose?.();
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      company,
      bank,
      accountNumber,
      clabe,
      claveBanxico: claveBanxico || undefined,
      branch: branch || undefined,
      initialBalance: Number(initialBalance),
      currentBalance: Number(currentBalance),
    };

    // Si es modo crear y no se ha tocado currentBalance, igualar a initialBalance
    if (
      mode === "create" &&
      (currentBalance === "" || currentBalance === undefined)
    ) {
      formData.currentBalance = Number(initialBalance);
    }

    try {
      let response;
      if (mode === "create") {
        response = await bankAccountsService.create(formData);
      } else if (editingBankAccount) {
        response = await bankAccountsService.update(
          editingBankAccount._id,
          formData
        );
      }

      if (response && response.success) {
        toast.success(
          `Cuenta bancaria ${mode === "create" ? "creada" : "actualizada"
          } correctamente.`
        );
        onBankAccountSaved?.();
        handleClose();
      } else {
        toast.error(
          response?.message ||
          `Error al ${mode === "create" ? "crear" : "actualizar"
          } la cuenta bancaria.`
        );
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(
        error.message ||
        `Ocurrió un error al ${mode === "create" ? "crear" : "actualizar"
        } la cuenta.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === "create"
              ? "Agregar Nueva Cuenta Bancaria"
              : "Editar Cuenta Bancaria"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Razón Social</Form.Label>
              <Form.Select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                disabled={!!defaultCompanyId}
              >
                <option value="">Selecciona una razón social</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Banco</Form.Label>
              <Form.Select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                required
              >
                <option value="">Selecciona un banco</option>
                {banks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Número de Cuenta</Form.Label>
              <Form.Control
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CLABE</Form.Label>
              <Form.Control
                type="text"
                value={clabe}
                onChange={(e) => setClabe(e.target.value)}
                required
                minLength={18}
                maxLength={18}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Clave Banxico (Opcional)</Form.Label>
              <Form.Control
                type="text"
                value={claveBanxico}
                onChange={(e) => setClaveBanxico(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Saldo Inicial</Form.Label>
              <Form.Control
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                required
                disabled={mode === "edit"}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Saldo Actual</Form.Label>
              <Form.Control
                type="number"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                required
                min="0"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sucursal (Opcional)</Form.Label>
              <Form.Control
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="light"
                onClick={handleClose}
                className="fw-medium px-4"
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-1">Guardando...</span>
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default BankAccountModal;
