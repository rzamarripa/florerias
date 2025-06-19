import MultiSelect, { SelectOption } from "@/components/forms/Multiselect";
import { getModalButtonStyles } from "@/utils/modalButtonStyles";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { BrandFormData, brandSchema } from "../schemas/BrandSchema";
import { brandsService } from "../services/brands";
import { Brand } from "../types";

interface BrandModalProps {
  brand?: Brand;
  mode?: "create" | "edit";
  onBrandSaved?: () => void;
}

const BrandModal: React.FC<BrandModalProps> = ({
  brand,
  mode = "create",
  onBrandSaved,
}) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      logo: undefined,
      category: "",
      name: "",
      description: "",
    },
  });

  const loadAllCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await brandsService.getAllCompanies();

      if (!response.success) {
        throw new Error(response.message || "Error al cargar las empresas");
      }

      const allCompanies: SelectOption[] = response.data.map((company) => ({
        value: company._id,
        label: company.name,
      }));

      setCompanyOptions(allCompanies);

      if (brand?.companies && Array.isArray(brand.companies)) {
        setSelectedCompanies(brand.companies);
      } else {
        setSelectedCompanies([]);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar las empresas";
      toast.error(errorMessage);
      setCompanyOptions([]);
      setSelectedCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadAllCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await brandsService.getAllCategories();

      if (!response.success) {
        throw new Error(response.message || "Error al cargar las categorías");
      }

      const allCategories: SelectOption[] = response.data.map((category) => ({
        value: category._id,
        label: category.name,
      }));

      setCategoryOptions(allCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al cargar las categorías";
      toast.error(errorMessage);
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (show) {
      if (brand) {
        reset({
          logo: undefined,
          category: "",
          name: brand.name,
          description: brand.description || "",
        });

        if (brand.logo && brand.logo.data && brand.logo.contentType) {
          const logoUrl = `data:${brand.logo.contentType};base64,${brand.logo.data}`;
          setLogoPreview(logoUrl);
        } else {
          setLogoPreview(null);
        }
      } else {
        reset({
          logo: undefined,
          category: "",
          name: "",
          description: "",
        });
        setSelectedCompanies([]);
        setLogoFile(null);
        setLogoPreview(null);
      }

      loadAllCompanies();
      loadAllCategories();
    }
  }, [show, brand, reset]);

  useEffect(() => {
    if (brand && categoryOptions.length > 0) {
      const categoryValue =
        typeof brand.categoryId === "object" && brand.categoryId
          ? brand.categoryId._id
          : brand.categoryId || "";

      if (categoryValue) {
        setValue("category", categoryValue);
      }
    }
  }, [brand, categoryOptions, setValue]);

  const handleClose = () => {
    setShow(false);
    reset();
    setSelectedCompanies([]);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setValue("logo", file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: BrandFormData) => {
    if (selectedCompanies.length === 0) {
      toast.error("Debe seleccionar al menos una empresa");
      return;
    }

    setLoading(true);
    try {
      const apiData = {
        name: data.name,
        category: data.category,
        description: data.description,
        rsCompanies: selectedCompanies,
        ...(logoFile && { logo: logoFile }),
      };

      if (mode === "edit" && brand) {
        const res = await brandsService.update(brand._id, apiData);
        if (!res.success) {
          throw new Error(res.message || "No se pudo actualizar la marca");
        }
        toast.success(res.message);
      } else {
        const res = await brandsService.create(apiData);
        if (!res.success) {
          throw new Error(res.message || "No se pudo crear la marca");
        }
        toast.success(res.message);
      }

      onBrandSaved?.();
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Algo salió mal";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const defaultButtonProps = getModalButtonStyles("Marca");
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
        disabled={mode === "edit" && !brand}
      >
        {finalButtonProps.children}
      </Button>

      <Modal centered show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === "edit" ? "Editar Marca" : "Agregar Marca"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Logo</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <div className="flex-grow-1">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    isInvalid={!!errors.logo}
                    style={{
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.logo?.message}
                  </Form.Control.Feedback>
                </div>
                {logoPreview && (
                  <div className="flex-shrink-0">
                    <Image
                      src={logoPreview}
                      alt="Vista previa"
                      width={40}
                      height={40}
                      style={{ objectFit: "cover" }}
                      className="rounded border"
                    />
                  </div>
                )}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Categoría</Form.Label>
              <Form.Select
                {...register("category")}
                isInvalid={!!errors.category}
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories
                    ? "Cargando categorías..."
                    : "Seleccionar categoría"}
                </option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.category?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Nombre <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                {...register("name")}
                isInvalid={!!errors.name}
                placeholder="Ingrese el nombre de la marca"
              />
              <Form.Control.Feedback type="invalid">
                {errors.name?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <MultiSelect
                label="Empresas"
                required
                value={selectedCompanies}
                options={companyOptions}
                onChange={setSelectedCompanies}
                loading={loadingCompanies}
                placeholder="Seleccionar empresas..."
                noOptionsMessage="No se encontraron empresas"
                loadingMessage="Cargando empresas..."
                maxMenuHeight={250}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                {...register("description")}
                isInvalid={!!errors.description}
                placeholder="Descripción de la marca"
              />
              <Form.Control.Feedback type="invalid">
                {errors.description?.message}
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
                ? "Actualizar"
                : "Guardar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default BrandModal;
