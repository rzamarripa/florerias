import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getModalButtonStyles } from "../../../../../utils/modalButtonStyles";
import { CompanyFormData, companySchema } from "../schemas/companyFormSchema";
import { companiesService } from "../services/companies";
import { Company } from "../types";

interface CompanyModalProps {
  company?: Company;
  mode?: "create" | "edit";
  onCompanySaved: () => void;
}

const CompanyModal: React.FC<CompanyModalProps> = ({
  company,
  mode = "create",
  onCompanySaved,
}) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      legalRepresentative: "",
      rfc: "",
      address: "",
    },
  });

  useEffect(() => {
    if (show && company) {
      reset({
        name: company.name,
        legalRepresentative: company.legalRepresentative,
        rfc: company.rfc,
        address: company.address,
      });
    } else if (show) {
      reset({
        name: "",
        legalRepresentative: "",
        rfc: "",
        address: "",
      });
    }
  }, [show, company, reset]);

  const handleClose = () => {
    setShow(false);
    reset();
  };

  const onSubmit = async (data: CompanyFormData) => {
    console.log("Datos del formulario:", data);
    setLoading(true);
    try {
      if (mode === "edit" && company) {
        const res = await companiesService.update(company._id, data);
        if (!res.success) {
          throw new Error("No se pudo actualizar la empresa");
        }
        toast.success(res.message);
        onCompanySaved();
        handleClose();
        return;
      }
      const res = await companiesService.create(data);
      if (!res.success) {
        throw new Error("No se pudo crear la empresa");
      }
      onCompanySaved();
      handleClose();
      return toast.success(res.message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Algo ocurrió mal";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRfcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setValue("rfc", value);
  };

  const defaultButtonProps = getModalButtonStyles("Empresa");
  const currentButtonConfig = defaultButtonProps[mode];
  const finalButtonProps = { ...currentButtonConfig };

  return (
    <>
      <Button
        variant={finalButtonProps.variant}
        size={finalButtonProps.size}
        className={finalButtonProps.className}
        title={finalButtonProps.title}
        onClick={() => setShow(true)}
        disabled={mode === "edit" && !company}
      >
        {finalButtonProps.children}
      </Button>

      <Modal centered show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === "edit" ? "Editar empresa" : "Agregar empresa"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la empresa</Form.Label>
              <Form.Control
                type="text"
                {...register("name")}
                isInvalid={!!errors.name}
                placeholder="Ingrese el nombre de la empresa"
              />
              <Form.Control.Feedback type="invalid">
                {errors.name?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Representante legal</Form.Label>
              <Form.Control
                type="text"
                {...register("legalRepresentative")}
                isInvalid={!!errors.legalRepresentative}
                placeholder="Ingrese el nombre del representante legal"
              />
              <Form.Control.Feedback type="invalid">
                {errors.legalRepresentative?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>RFC</Form.Label>
              <Form.Control
                type="text"
                {...register("rfc")}
                onChange={handleRfcChange}
                isInvalid={!!errors.rfc}
                placeholder="Ingrese el RFC"
                style={{ textTransform: "uppercase" }}
              />
              <Form.Control.Feedback type="invalid">
                {errors.rfc?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                {...register("address")}
                isInvalid={!!errors.address}
                placeholder="Ingrese la dirección"
              />
              <Form.Control.Feedback type="invalid">
                {errors.address?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="light"
              onClick={handleClose}
              disabled={loading}
              className="fw-medium px-4"
            >
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : mode === "edit"
                ? "Guardar cambios"
                : "Agregar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default CompanyModal;
