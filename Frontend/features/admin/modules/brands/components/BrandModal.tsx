import React, { useEffect, useState } from "react";
import { Modal, Button, Form} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { brandsService, Brand } from "../services/brands";
import { BrandFormData, brandSchema } from "../schemas/BrandSchema";
import Image from "next/image";

interface BrandModalProps {
  brand?: Brand;
  show: boolean;
  onClose: () => void;
  reloadData: (isCreating: boolean, page?: number) => Promise<void>;
  editingBrand?: string;
}

const BrandModal: React.FC<BrandModalProps> = ({ brand, show, onClose, reloadData, editingBrand }) => {
  const [loading, setLoading] = useState(false);
  const [razonesSociales, setRazonesSociales] = useState<string[]>([]);
  const [newRazonSocial, setNewRazonSocial] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    setValue,
    watch
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      logo: "",
      categoria: "",
      nombre: "",
      razonesSociales: "",
      descripcion: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (show && brand) {
      reset({
        logo: brand.logo || "",
        categoria: brand.category || "",
        nombre: brand.name,
        razonesSociales: brand.razonesSociales || "",
        descripcion: brand.description || "",
        isActive: brand.isActive,
      });
      if (brand.razonesSociales) {
        setRazonesSociales(brand.razonesSociales.split(',').map(rs => rs.trim()));
      }
      if (brand.logo) {
        setLogoPreview(brand.logo);
      }
    } else if (show) {
      reset({
        logo: "",
        categoria: "",
        nombre: "",
        razonesSociales: "",
        descripcion: "",
        isActive: true,
      });
      setRazonesSociales([]);
      setLogoFile(null);
      setLogoPreview("");
    }
  }, [show, brand, reset]);

  const handleAddRazonSocial = () => {
    if (newRazonSocial.trim() && !razonesSociales.includes(newRazonSocial.trim())) {
      const updatedRazones = [...razonesSociales, newRazonSocial.trim()];
      setRazonesSociales(updatedRazones);
      setValue("razonesSociales", updatedRazones.join(', '));
      setNewRazonSocial("");
    }
  };

  const handleRemoveRazonSocial = (index: number) => {
    const updatedRazones = razonesSociales.filter((_, i) => i !== index);
    setRazonesSociales(updatedRazones);
    setValue("razonesSociales", updatedRazones.join(', '));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRazonSocial();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setValue("logo", result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: BrandFormData) => {
    console.log('Datos del formulario:', data);
    setLoading(true);
    try {
      const apiData = {
        name: data.nombre,
        category: data.categoria,
        description: data.descripcion,
        isActive: data.isActive,
        rsCompanies: [],
        ...(logoFile && { logo: logoFile })
      };

      if (editingBrand) {
        const res = await brandsService.update(editingBrand, apiData);
        if (!res.success) {
          throw new Error(res.message || 'No se pudo actualizar la marca');
        }
        toast.success(res.message);
      } else {
        const res = await brandsService.create(apiData);
        if (!res.success) {
          throw new Error(res.message || 'No se pudo crear la marca');
        }
        toast.success(res.message);
      }
      
      await reloadData(false);
      onClose();
        
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Algo ocurrió mal";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal centered show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {brand ? "Editar marca" : "Agregar marca"}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>

          <Form.Group className="mb-3">
            <Form.Label>Logo</Form.Label>
            <Form.Control 
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              isInvalid={!!errors.logo}
            />
            {logoPreview && (
              <div className="mt-2">
                <Image 
                  src={logoPreview} 
                  alt="Preview" 
                  style={{ width: "80px", height: "80px", objectFit: "cover" }}
                  className="rounded border"
                />
              </div>
            )}
            <Form.Control.Feedback type="invalid">
              {errors.logo?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Categoría</Form.Label>
            <Form.Select 
              {...register("categoria")}
              isInvalid={!!errors.categoria}
            >
              <option value="">Seleccionar categoría</option>
              <option value="tecnologia">Tecnología</option>
              <option value="alimentaria">Alimentaria</option>
              <option value="textil">Textil</option>
              <option value="automotriz">Automotriz</option>
              <option value="farmaceutica">Farmacéutica</option>
              <option value="construccion">Construcción</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.categoria?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="text"
              {...register("nombre")}
              isInvalid={!!errors.nombre}
              placeholder="Ingrese el nombre de la marca"
            />
            <Form.Control.Feedback type="invalid">
              {errors.nombre?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Razones Sociales <span className="text-danger">*</span></Form.Label>
            <div className="mb-2">
              <div className="input-group">
                <Form.Control 
                  type="text"
                  value={newRazonSocial}
                  onChange={(e) => setNewRazonSocial(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Agregar razón social"
                />
                <Button 
                  variant="outline-secondary" 
                  type="button"
                  onClick={handleAddRazonSocial}
                  disabled={!newRazonSocial.trim()}
                >
                  Agregar
                </Button>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {razonesSociales.map((razon, index) => (
                <div 
                  key={index}
                  className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded d-flex align-items-center gap-2"
                >
                  <span>{razon}</span>
                  <button
                    type="button"
                    className="btn-close btn-close-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleRemoveRazonSocial(index)}
                    aria-label="Eliminar"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            {errors.razonesSociales && (
              <div className="text-danger small mt-1">
                {errors.razonesSociales?.message}
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              {...register("descripcion")}
              isInvalid={!!errors.descripcion}
              placeholder="Descripción de la marca"
            />
            <Form.Control.Feedback type="invalid">
              {errors.descripcion?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Estatus</Form.Label>
            <div className="form-check form-switch">
              <Form.Check 
                type="switch"
                id="brand-status"
                {...register("isActive")}
                label={watch("isActive") ? "Activo" : "Inactivo"}
                className="fs-5"
              />
            </div>
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
            {loading ? "Guardando..." : (brand ? "Guardar cambios" : "Guardar")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default BrandModal;