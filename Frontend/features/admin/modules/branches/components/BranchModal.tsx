import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { BsPencil } from "react-icons/bs";
import { toast } from "react-toastify";
import { BranchFormData, branchSchema } from "../schemas/BranchSchema";
import { branchService } from "../services/branch";
import { Brand, brandsService } from "../services/brands";
import { Company, companiesService } from "../services/companies";
import { Country, countriesService } from "../services/countries";
import {
  Municipality,
  municipalitiesService,
} from "../services/municipalities";
import { State, statesService } from "../services/states";
import { Branch } from "../types";

interface BranchModalProps {
  mode: "create" | "edit";
  onBranchSaved?: () => void;
  editingBranch?: Branch | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const BranchModal: React.FC<BranchModalProps> = ({
  mode,
  onBranchSaved,
  editingBranch = null,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isEditing = mode === "edit";

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      companyId: "",
      brandId: "",
      countryId: "",
      stateId: "",
      municipalityId: "",
      address: "",
      phone: "",
      email: "",
      description: "",
    },
    mode: "onChange",
  });

  const selectedCountry = watch("countryId");
  const selectedState = watch("stateId");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  useEffect(() => {
    if (showModal) {
      if (isEditing && editingBranch) {
        setValue("name", editingBranch.name);
        setValue(
          "companyId",
          typeof editingBranch.companyId === "object"
            ? editingBranch.companyId._id
            : editingBranch.companyId
        );
        setValue(
          "brandId",
          typeof editingBranch.brandId === "object"
            ? editingBranch.brandId._id
            : editingBranch.brandId
        );
        setValue(
          "countryId",
          typeof editingBranch.countryId === "object"
            ? editingBranch.countryId._id
            : editingBranch.countryId
        );
        setValue(
          "stateId",
          typeof editingBranch.stateId === "object"
            ? editingBranch.stateId._id
            : editingBranch.stateId
        );
        setValue(
          "municipalityId",
          typeof editingBranch.municipalityId === "object"
            ? editingBranch.municipalityId._id
            : editingBranch.municipalityId
        );
        setValue("address", editingBranch.address);
        setValue("phone", editingBranch.phone);
        setValue("email", editingBranch.email);
        setValue("description", editingBranch.description || "");
      } else {
        reset();
      }
    }
  }, [showModal, isEditing, editingBranch, setValue, reset]);

  useEffect(() => {
    if (selectedCountry) {
      setValue("stateId", "");
      setValue("municipalityId", "");
    }
  }, [selectedCountry, setValue]);

  useEffect(() => {
    if (selectedState) {
      setValue("municipalityId", "");
    }
  }, [selectedState, setValue]);

  useEffect(() => {
    if (showModal) {
      setLoadingCompanies(true);
      setLoadingBrands(true);
      setLoadingCountries(true);
      companiesService
        .getAll()
        .then((res) => setCompanies(res.data || []))
        .finally(() => setLoadingCompanies(false));
      brandsService
        .getAllForSelects()
        .then((res) => setBrands(res.data || []))
        .finally(() => setLoadingBrands(false));
      countriesService
        .getAll()
        .then((res) => setCountries(res.data || []))
        .finally(() => setLoadingCountries(false));
    }
  }, [showModal]);

  useEffect(() => {
    if (selectedCountry) {
      setLoadingStates(true);
      statesService
        .getByCountry(selectedCountry)
        .then((res) => setStates(res.data || []))
        .finally(() => setLoadingStates(false));
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      setLoadingMunicipalities(true);
      municipalitiesService
        .getByState(selectedState)
        .then((res) => setMunicipalities(res.data || []))
        .finally(() => setLoadingMunicipalities(false));
    } else {
      setMunicipalities([]);
    }
  }, [selectedState]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: BranchFormData) => {
    try {
      if (isEditing && editingBranch) {
        await branchService.update(editingBranch._id, {
          ...data,
          _id: editingBranch._id,
        });
        toast.success("Sucursal actualizada correctamente");
      } else {
        await branchService.create(data);
        toast.success("Sucursal creada correctamente");
      }
      setShowModal(false);
      reset();
      if (onBranchSaved) onBranchSaved();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la sucursal");
    }
  };

  const defaultButtonProps = {
    create: {
      variant: "primary",
      className: "d-flex align-items-center gap-2 text-nowrap px-3",
      title: "Nueva Sucursal",
      children: (
        <>
          <Plus size={18} />
          Nueva Sucursal
        </>
      ),
    },
    edit: {
      variant: "light",
      size: "sm" as const,
      className: "btn-icon rounded-circle",
      title: "Editar sucursal",
      children: <BsPencil size={16} />,
    },
  };

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
      >
        {finalButtonProps.children}
      </Button>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Sucursal" : "Nueva Sucursal"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Razón Social <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="companyId"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.companyId}
                        disabled={loadingCompanies}
                      >
                        <option value="">Seleccionar razón social</option>
                        {companies.map((company) => (
                          <option key={company._id} value={company._id}>
                            {company.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.companyId?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Marca <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="brandId"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.brandId}
                        disabled={loadingBrands}
                      >
                        <option value="">Seleccionar marca</option>
                        {brands.map((brand) => (
                          <option key={brand._id} value={brand._id}>
                            {brand.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.brandId?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>
                Nombre <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Nombre de la Sucursal"
                    isInvalid={!!errors.name}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    País <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="countryId"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.countryId}
                        disabled={loadingCountries}
                      >
                        <option value="">Seleccionar país</option>
                        {countries.map((country) => (
                          <option key={country._id} value={country._id}>
                            {country.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.countryId?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Estado <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="stateId"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.stateId}
                        disabled={loadingStates || !selectedCountry}
                      >
                        <option value="">
                          {selectedCountry
                            ? "Seleccionar estado"
                            : "Primero selecciona un país"}
                        </option>
                        {states.map((state) => (
                          <option key={state._id} value={state._id}>
                            {state.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.stateId?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Ciudad <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="municipalityId"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.municipalityId}
                        disabled={loadingMunicipalities || !selectedState}
                      >
                        <option value="">
                          {selectedState
                            ? "Seleccionar ciudad"
                            : "Primero selecciona un estado"}
                        </option>
                        {municipalities.map((municipality) => (
                          <option
                            key={municipality._id}
                            value={municipality._id}
                          >
                            {municipality.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.municipalityId?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>
                Dirección <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Dirección completa de la sucursal"
                    isInvalid={!!errors.address}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.address?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Teléfono <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        type="tel"
                        placeholder="Número de teléfono"
                        isInvalid={!!errors.phone}
                        {...field}
                      />
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone?.message}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Ejemplo: +52 33 1234 5678
                  </Form.Text>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Correo <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        type="email"
                        placeholder="correo@ejemplo.com"
                        isInvalid={!!errors.email}
                        {...field}
                      />
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Descripción opcional de la sucursal"
                    isInvalid={!!errors.description}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
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

export default BranchModal;
