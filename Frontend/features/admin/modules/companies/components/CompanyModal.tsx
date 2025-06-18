import React, { useEffect, useState } from "react";
import { Modal, Button, Form} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companiesService, Company } from "../services/companies";
import { CompanyFormData, companySchema } from "../schemas/companyFormSchema";
import { toast } from "react-toastify";


interface CompanyModalProps {
  company?: Company;
  show: boolean;
  onClose: () => void;
  reloadData: (isCreating: boolean, page?: number) => Promise<void>;
  editingCompany?: string
}

const CompanyModal: React.FC<CompanyModalProps> = ({ company, show, onClose, reloadData, editingCompany }) => {
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

  const onSubmit = async (data: CompanyFormData) => {
    console.log('Datos del formulario:', data);
    setLoading(true);
    try {
      if(editingCompany){
        const res = await companiesService.update(editingCompany, data)
        if(!res.success){
          throw new Error('No se pudo actualizar la razon social')
        }
        toast.success(res.message)
        await reloadData(false);
        onClose();
        return
      }
      const res = await companiesService.create(data);
        if(!res.success){
          throw new Error('No se pudo actualizar la razon social')
        }  
        await reloadData(false);
        onClose();
        return toast.success(res.message)
        
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Algo ocurrió mal" 
      toast.error(errorMessage)
    } finally {
      setLoading(false);
    }
  };

  const handleRfcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setValue("rfc", value);
  };

  return (
    <Modal centered show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {company ? "Editar empresa" : "Agregar empresa"}
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
              style={{ textTransform: 'uppercase' }}
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
            onClick={onClose} 
            disabled={loading}
            className="fw-medium px-4"
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Guardando..." : (company ? "Guardar cambios" : "Agregar")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CompanyModal;