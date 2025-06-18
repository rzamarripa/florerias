import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { BsPencil } from "react-icons/bs";
import { toast } from "react-toastify";
import { SucursalFormData, sucursalSchema } from "../schemas/BranchSchema";
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

interface BranchModal {
  mode: "create" | "edit";
  onSucursalSaved?: () => void;
  editingSucursal?: Branch | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const BranchModal: React.FC<BranchModal> = ({
  mode,
  onSucursalSaved,
  editingSucursal = null,
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
  } = useForm<SucursalFormData>({
    resolver: zodResolver(sucursalSchema),
    defaultValues: {
      nombre: "",
      companyId: "",
      marca: "",
      pais: "",
      estado: "",
      ciudad: "",
      direccion: "",
      telefono: "",
      correo: "",
      descripcion: "",
    },
    mode: "onChange",
  });

  const paisSeleccionado = watch("pais");
  const estadoSeleccionado = watch("estado");

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
      if (isEditing && editingSucursal) {
        setValue("nombre", editingSucursal.name);
        setValue(
          "companyId",
          typeof editingSucursal.companyId === "object"
            ? editingSucursal.companyId._id
            : editingSucursal.companyId
        );
        setValue(
          "marca",
          typeof editingSucursal.brandId === "object"
            ? editingSucursal.brandId._id
            : editingSucursal.brandId
        );
        setValue(
          "pais",
          typeof editingSucursal.countryId === "object"
            ? editingSucursal.countryId._id
            : editingSucursal.countryId
        );
        setValue(
          "estado",
          typeof editingSucursal.stateId === "object"
            ? editingSucursal.stateId._id
            : editingSucursal.stateId
        );
        setValue(
          "ciudad",
          typeof editingSucursal.municipalityId === "object"
            ? editingSucursal.municipalityId._id
            : editingSucursal.municipalityId
        );
        setValue("direccion", editingSucursal.address);
        setValue("telefono", editingSucursal.phone);
        setValue("correo", editingSucursal.email);
        setValue("descripcion", editingSucursal.description || "");
      } else {
        reset();
      }
    }
  }, [showModal, isEditing, editingSucursal, setValue, reset]);

  useEffect(() => {
    if (paisSeleccionado) {
      setValue("estado", "");
      setValue("ciudad", "");
    }
  }, [paisSeleccionado, setValue]);

  useEffect(() => {
    if (estadoSeleccionado) {
      setValue("ciudad", "");
    }
  }, [estadoSeleccionado, setValue]);

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
        .getAll()
        .then((res) => setBrands(res.data || []))
        .finally(() => setLoadingBrands(false));
      countriesService
        .getAll()
        .then((res) => setCountries(res.data || []))
        .finally(() => setLoadingCountries(false));
    }
  }, [showModal]);

  useEffect(() => {
    if (paisSeleccionado) {
      setLoadingStates(true);
      statesService
        .getByCountry(paisSeleccionado)
        .then((res) => setStates(res.data || []))
        .finally(() => setLoadingStates(false));
    } else {
      setStates([]);
    }
  }, [paisSeleccionado]);

  useEffect(() => {
    if (estadoSeleccionado) {
      setLoadingMunicipalities(true);
      municipalitiesService
        .getByState(estadoSeleccionado)
        .then((res) => setMunicipalities(res.data || []))
        .finally(() => setLoadingMunicipalities(false));
    } else {
      setMunicipalities([]);
    }
  }, [estadoSeleccionado]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: SucursalFormData) => {
    try {
      const payload = {
        companyId: data.companyId,
        brandId: data.marca,
        name: data.nombre,
        countryId: data.pais,
        stateId: data.estado,
        municipalityId: data.ciudad,
        address: data.direccion,
        phone: data.telefono,
        email: data.correo,
        description: data.descripcion,
      };
      if (isEditing && editingSucursal) {
        await branchService.update(editingSucursal._id, {
          ...payload,
          _id: editingSucursal._id,
        });
        toast.success("Sucursal actualizada correctamente");
      } else {
        await branchService.create(payload);
        toast.success("Sucursal creada correctamente");
      }
      setShowModal(false);
      reset();
      if (onSucursalSaved) onSucursalSaved();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la sucursal");
    }
  };

  // const filteredBrands: Brand[] = brands.filter((brand) => {
  //   if (!watch("companyId")) return true;
  //   return brand.companies?.includes(watch("companyId"));
  // });

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
                    name="marca"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.marca}
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
                    {errors.marca?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>
                Nombre <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Nombre de la Sucursal"
                    isInvalid={!!errors.nombre}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.nombre?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    País <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="pais"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.pais}
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
                    {errors.pais?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Estado <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.estado}
                        disabled={loadingStates || !paisSeleccionado}
                      >
                        <option value="">
                          {paisSeleccionado
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
                    {errors.estado?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Ciudad <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="ciudad"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.ciudad}
                        disabled={loadingMunicipalities || !estadoSeleccionado}
                      >
                        <option value="">
                          {estadoSeleccionado
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
                    {errors.ciudad?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>
                Dirección <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Dirección completa de la sucursal"
                    isInvalid={!!errors.direccion}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.direccion?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Teléfono <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        type="tel"
                        placeholder="Número de teléfono"
                        isInvalid={!!errors.telefono}
                        {...field}
                      />
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.telefono?.message}
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
                    name="correo"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        type="email"
                        placeholder="correo@ejemplo.com"
                        isInvalid={!!errors.correo}
                        {...field}
                      />
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.correo?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Descripción opcional de la sucursal"
                    isInvalid={!!errors.descripcion}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.descripcion?.message}
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
