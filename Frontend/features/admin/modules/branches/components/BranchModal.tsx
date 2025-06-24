import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { BsPencil } from "react-icons/bs";
import { toast } from "react-toastify";
import MultiSelect from "@/components/forms/Multiselect";
import { BranchFormData, branchSchema } from "../schemas/BranchSchema";
import { branchService } from "../services/branch";
import { Brand, brandsService } from "../services/brands";
import { companiesService, Company } from "../services/companies";
import { countriesService, Country } from "../services/countries";
import {
  municipalitiesService,
  Municipality,
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
      rsBrands: [],
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

  const selectedCompany = watch("companyId");
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
      setLoadingCompanies(true);
      setLoadingCountries(true);

      Promise.all([companiesService.getAll(), countriesService.getAll()])
        .then(([companiesRes, countriesRes]) => {
          setCompanies(companiesRes.data || []);
          setCountries(countriesRes.data || []);
        })
        .finally(() => {
          setLoadingCompanies(false);
          setLoadingCountries(false);
        });

      if (isEditing && editingBranch) {
        setValue("name", editingBranch.name);
        setValue(
          "companyId",
          typeof editingBranch.companyId === "object"
            ? editingBranch.companyId._id
            : editingBranch.companyId
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

        // Cargar marcas de la sucursal usando el nuevo endpoint
        setLoadingBrands(true);
        branchService.getBranchBrands(editingBranch._id)
          .then((res: any) => {
            if (res.success && Array.isArray(res.data)) {
              const brandIds = res.data.map((brand: any) => brand._id);
              setValue("rsBrands", brandIds);
            }
          })
          .catch((error: any) => {
            console.error("Error loading branch brands:", error);
          })
          .finally(() => setLoadingBrands(false));

        // Cargar marcas de la compañía seleccionada
        const companyId =
          typeof editingBranch.companyId === "object"
            ? editingBranch.companyId._id
            : editingBranch.companyId;

        setLoadingBrands(true);
        brandsService
          .getByCompany(companyId)
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setBrands(res.data);
            }
          })
          .finally(() => setLoadingBrands(false));

        // Cargar estados del país seleccionado
        setLoadingStates(true);
        statesService
          .getByCountry(
            typeof editingBranch.countryId === "object"
              ? editingBranch.countryId._id
              : editingBranch.countryId
          )
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setStates(res.data);
            }
          })
          .finally(() => setLoadingStates(false));

        // Cargar municipios del estado seleccionado
        setLoadingMunicipalities(true);
        municipalitiesService
          .getByState(
            typeof editingBranch.stateId === "object"
              ? editingBranch.stateId._id
              : editingBranch.stateId
          )
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setMunicipalities(res.data);
            }
          })
          .finally(() => setLoadingMunicipalities(false));
      } else {
        reset();
      }
    }
  }, [showModal, isEditing, editingBranch, setValue, reset]);

  useEffect(() => {
    if (selectedCompany && !isEditing) {
      setLoadingBrands(true);
      setBrands([]);
      setValue("rsBrands", []);

      brandsService
        .getByCompany(selectedCompany)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setBrands(res.data);
          }
        })
        .catch((error) => {
          console.error("Error loading brands:", error);
          toast.error("Error al cargar las marcas");
        })
        .finally(() => setLoadingBrands(false));
    }
  }, [selectedCompany, setValue, isEditing]);

  useEffect(() => {
    if (selectedCountry && !isEditing) {
      setLoadingStates(true);
      setStates([]);
      setValue("stateId", "");
      setValue("municipalityId", "");

      statesService
        .getByCountry(selectedCountry)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setStates(res.data);
          }
        })
        .catch((error) => {
          console.error("Error loading states:", error);
          toast.error("Error al cargar los estados");
        })
        .finally(() => setLoadingStates(false));
    }
  }, [selectedCountry, setValue, isEditing]);

  useEffect(() => {
    if (selectedState && !isEditing) {
      setLoadingMunicipalities(true);
      setMunicipalities([]);
      setValue("municipalityId", "");

      municipalitiesService
        .getByState(selectedState)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMunicipalities(res.data);
          }
        })
        .catch((error) => {
          console.error("Error loading municipalities:", error);
          toast.error("Error al cargar los municipios");
        })
        .finally(() => setLoadingMunicipalities(false));
    }
  }, [selectedState, setValue, isEditing]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: BranchFormData) => {
    try {
      const submitData = {
        ...data,
        rsBrands: data.rsBrands || [],
      };

      if (isEditing && editingBranch) {
        await branchService.update(editingBranch._id, {
          ...submitData,
          _id: editingBranch._id,
        });
        toast.success("Sucursal actualizada correctamente");
      } else {
        await branchService.create(submitData);
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
                <Controller
                  name="rsBrands"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      value={field.value || []}
                      options={brands.map((brand) => ({
                        value: brand._id,
                        label: brand.name,
                      }))}
                      onChange={field.onChange}
                      loading={loadingBrands}
                      disabled={!selectedCompany}
                      label="Marcas"
                      placeholder={selectedCompany ? "Seleccionar marcas..." : "Primero selecciona una razón social"}
                      required
                      error={errors.rsBrands?.message}
                    />
                  )}
                />
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

export default BranchModal;
