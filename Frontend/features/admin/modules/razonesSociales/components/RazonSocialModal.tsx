import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { RazonSocial } from "../services/razonesSociales";

interface RazonSocialModalProps {
  razon?: RazonSocial;
  show: boolean;
  onClose: () => void;
  onSave: (data: { nombreComercial: string; razonSocial: string; direccion: string; estatus: boolean }) => Promise<void>;
}

const RazonSocialModal: React.FC<RazonSocialModalProps> = ({ razon, show, onClose, onSave }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    nombreComercial: string;
    razonSocial: string;
    direccion: string;
    estatus: boolean;
  }>({
    defaultValues: {
      nombreComercial: razon?.nombreComercial || "",
      razonSocial: razon?.razonSocial || "",
      direccion: razon?.direccion || "",
      estatus: razon?.estatus ?? true,
    },
  });

  useEffect(() => {
    if (show && razon) {
      reset({
        nombreComercial: razon.nombreComercial,
        razonSocial: razon.razonSocial,
        direccion: razon.direccion,
        estatus: razon.estatus,
      });
    } else if (show) {
      reset({ nombreComercial: "", razonSocial: "", direccion: "", estatus: true });
    }
  }, [show, razon, reset]);

  const onSubmit = async (data: { nombreComercial: string; razonSocial: string; direccion: string; estatus: boolean }) => {
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
        <Modal.Title>{razon ? "Editar razón social" : "Agregar razón social"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Nombre comercial</Form.Label>
            <Form.Control {...register("nombreComercial", { required: true })} isInvalid={!!errors.nombreComercial} />
            <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Razón social</Form.Label>
            <Form.Control {...register("razonSocial", { required: true })} isInvalid={!!errors.razonSocial} />
            <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control {...register("direccion", { required: true })} isInvalid={!!errors.direccion} />
            <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Estatus</Form.Label>
            <Form.Check
              type="switch"
              label={"Activo"}
              {...register("estatus")}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {razon ? "Guardar cambios" : "Agregar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RazonSocialModal; 