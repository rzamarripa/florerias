import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Company } from "../services/companies";

interface CompanyModalProps {
  company?: Company;
  show: boolean;
  onClose: () => void;
  onSave: (data: { tradeName: string; legalName: string; address: string; isActive: boolean }) => Promise<void>;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ company, show, onClose, onSave }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    tradeName: string;
    legalName: string;
    address: string;
    isActive: boolean;
  }>({
    defaultValues: {
      tradeName: company?.tradeName || "",
      legalName: company?.legalName || "",
      address: company?.address || "",
      isActive: company?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (show && company) {
      reset({
        tradeName: company.tradeName,
        legalName: company.legalName,
        address: company.address,
        isActive: company.isActive,
      });
    } else if (show) {
      reset({ tradeName: "", legalName: "", address: "", isActive: true });
    }
  }, [show, company, reset]);

  const onSubmit = async (data: { tradeName: string; legalName: string; address: string; isActive: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{company ? "Editar razón social" : "Agregar razón social"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Nombre comercial</Form.Label>
            <Form.Control {...register("tradeName", { required: true })} isInvalid={!!errors.tradeName} />
            <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Razón social</Form.Label>
            <Form.Control {...register("legalName", { required: true })} isInvalid={!!errors.legalName} />
            <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control {...register("address", { required: true })} isInvalid={!!errors.address} />
            <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Estatus</Form.Label>
            <Form.Check
              type="switch"
              label={"Activo"}
              {...register("isActive")}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button className={`fw-medium px-4 btn-light`} onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {company ? "Guardar cambios" : "Agregar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CompanyModal;