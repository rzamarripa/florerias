import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import MultiSelect from "@/components/forms/Multiselect";
import {
  BranchFormData,
  branchSchema,
} from "../../branches/schemas/BranchSchema";
import { branchService } from "../../branches/services/branch";
import { Brand, brandsService } from "../../branches/services/brands";
import { companiesService, Company } from "../../branches/services/companies";
import { countriesService, Country } from "../../branches/services/countries";
import {
  municipalitiesService,
  Municipality,
} from "../../branches/services/municipalities";
import { State, statesService } from "../../branches/services/states";

interface StructureBranchModalProps {
  show: boolean;
  onHide: () => void;
  onBranchSaved: () => void;
  companyId: string;
  brandId: string;
}

const StructureBranchModal: React.FC<StructureBranchModalProps> = ({
  show,
  onHide,
  onBranchSaved,
  companyId,
  brandId,
}) => {
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
      companyId: companyId,
      rsBrands: [brandId],
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

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  useEffect(() => {
    if (show) {
      setLoadingCountries(true);

      Promise.all([companiesService.getAll(), countriesService.getAll()])
        .then(([companiesRes, countriesRes]) => {
          setCompanies(companiesRes.data || []);
          setCountries(countriesRes.data || []);
        })
        .finally(() => {
          setLoadingCountries(false);
        });

      setLoadingBrands(true);
      brandsService
        .getByCompany(companyId)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setBrands(res.data);
          }
        })
        .finally(() => setLoadingBrands(false));

      reset({
        name: "",
        companyId: companyId,
        rsBrands: brandId ? [brandId] : [],
        countryId: "",
        stateId: "",
        municipalityId: "",
        address: "",
        phone: "",
        email: "",
        description: "",
      });
    }
  }, [show, companyId, brandId, reset]);

  useEffect(() => {
    if (selectedCountry) {
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
  }, [selectedCountry, setValue]);

  useEffect(() => {
    if (selectedState) {
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
  }, [selectedState, setValue]);

  const handleCloseModal = () => {
    reset();
    onHide();
  };

  const onSubmit = async (data: BranchFormData) => {
    try {
      const submitData = {
        ...data,
        rsBrands: brandId ? [brandId] : data.rsBrands || [],
      };

      await branchService.create(submitData);
      toast.success("Sucursal creada correctamente");
      handleCloseModal();
      onBranchSaved();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la sucursal");
    }
  };

  return (
    <Modal show={show} onHide={handleCloseModal} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Nueva Sucursal</Modal.Title>
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
                      disabled={true}
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
                <Form.Text className="text-muted">
                  La razón social se selecciona automáticamente desde la
                  estructura
                </Form.Text>
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
                    disabled={!!brandId}
                    label="Marcas"
                    placeholder={
                      brandId ? "Marcas seleccionadas" : "Seleccionar marcas..."
                    }
                    required
                    error={errors.rsBrands?.message}
                  />
                )}
              />
              <Form.Text className="text-muted">
                {brandId
                  ? "La marca se selecciona automáticamente desde la estructura"
                  : "Selecciona las marcas asociadas a esta sucursal"}
              </Form.Text>
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
                        <option key={municipality._id} value={municipality._id}>
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
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default StructureBranchModal;
