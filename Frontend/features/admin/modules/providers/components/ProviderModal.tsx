import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getModalButtonStyles } from "../../../../../utils/modalButtonStyles";
import { providerSchema, ProviderFormData } from "../schemas/providerSchema";
import { Provider, Location, BankAccount } from "../types";
import {
  getAllCountries,
  getStatesByCountry,
  getMunicipalitiesByState,
  getAllBanks,
  getAllBranches,
  getBankAccountsByBank,
  createProvider,
  updateProvider,
} from "../services/providers";

interface ProviderModalProps {
  mode: "create" | "edit";
  onProviderSaved?: () => void;
  editingProvider?: Provider | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const ProviderModal: React.FC<ProviderModalProps> = ({
  mode,
  onProviderSaved,
  editingProvider = null,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isEditing = mode === "edit";

  const [countries, setCountries] = useState<Location[]>([]);
  const [states, setStates] = useState<Location[]>([]);
  const [municipalities, setMunicipalities] = useState<Location[]>([]);
  const [banks, setBanks] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Location[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema) as any,
    defaultValues: {
      commercialName: "",
      businessName: "",
      rfc: "",
      contactName: "",
      countryId: "",
      stateId: "",
      municipalityId: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      bank: "",
      bankAccountId: "",
      accountNumber: "",
      clabe: "",
      referencia: "",
      sucursal: "",
      isActive: true,
    },
    mode: "onChange",
  });

  const countrySelected = watch("countryId");
  const stateSelected = watch("stateId");
  const bankSelected = watch("bank");

  useEffect(() => {
    if (showModal) {
      setLoadingCountries(true);
      setLoadingBanks(true);
      setLoadingBranches(true);

      // Cargar países
      getAllCountries()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setCountries(res.data);
          }
        })
        .finally(() => setLoadingCountries(false));

      // Cargar bancos
      getAllBanks()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setBanks(res.data);
          }
        })
        .finally(() => setLoadingBanks(false));

      // Cargar sucursales
      getAllBranches()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setBranches(res.data);
          }
        })
        .finally(() => setLoadingBranches(false));

      if (isEditing && editingProvider) {
        setValue("commercialName", editingProvider.commercialName);
        setValue("businessName", editingProvider.businessName);
        setValue("rfc", editingProvider.rfc);
        setValue("contactName", editingProvider.contactName);
        setValue("countryId", editingProvider.countryId._id);
        setValue("stateId", editingProvider.stateId._id);
        setValue("municipalityId", editingProvider.municipalityId._id);
        setValue("address", editingProvider.address);
        setValue("phone", editingProvider.phone);
        setValue("email", editingProvider.email);
        setValue("description", editingProvider.description || "");
        setValue("bank", editingProvider.bank._id);
        setValue("accountNumber", editingProvider.accountNumber);
        setValue("clabe", editingProvider.clabe);
        setValue("referencia", editingProvider.referencia);
        setValue("sucursal", editingProvider.sucursal._id);
        setValue("isActive", editingProvider.isActive);

        // Cargar estados del país seleccionado
        setLoadingStates(true);
        getStatesByCountry(editingProvider.countryId._id)
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setStates(res.data);
            }
          })
          .finally(() => setLoadingStates(false));

        // Cargar municipios del estado seleccionado
        setLoadingMunicipalities(true);
        getMunicipalitiesByState(editingProvider.stateId._id)
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setMunicipalities(res.data);
            }
          })
          .finally(() => setLoadingMunicipalities(false));

        // Cargar cuentas bancarias del banco seleccionado
        setLoadingBankAccounts(true);
        getBankAccountsByBank(editingProvider.bank._id)
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setBankAccounts(res.data);
            }
          })
          .finally(() => setLoadingBankAccounts(false));
      } else {
        reset();
      }
    }
  }, [showModal, isEditing, editingProvider, setValue, reset]);

  useEffect(() => {
    if (countrySelected && !isEditing) {
      setLoadingStates(true);
      setStates([]);
      setValue("stateId", "");
      setValue("municipalityId", "");

      getStatesByCountry(countrySelected)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setStates(res.data);
          }
        })
        .finally(() => setLoadingStates(false));
    }
  }, [countrySelected, setValue, isEditing]);

  useEffect(() => {
    if (stateSelected && !isEditing) {
      setLoadingMunicipalities(true);
      setMunicipalities([]);
      setValue("municipalityId", "");

      getMunicipalitiesByState(stateSelected)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMunicipalities(res.data);
          }
        })
        .finally(() => setLoadingMunicipalities(false));
    }
  }, [stateSelected, setValue, isEditing]);

  useEffect(() => {
    if (bankSelected) {
      setLoadingBankAccounts(true);
      setBankAccounts([]);
      setValue("bankAccountId", "");
      setValue("accountNumber", "");
      setValue("clabe", "");

      getBankAccountsByBank(bankSelected)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setBankAccounts(res.data);
          }
        })
        .finally(() => setLoadingBankAccounts(false));
    }
  }, [bankSelected, setValue]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEditing && editingProvider) {
        const res = await updateProvider(editingProvider._id, data);
        if (res.success) {
          toast.success("Proveedor actualizado exitosamente");
          onProviderSaved?.();
          handleCloseModal();
        } else {
          toast.error(res.message || "Error al actualizar proveedor");
        }
      } else {
        const res = await createProvider(data);
        if (res.success) {
          toast.success("Proveedor creado exitosamente");
          onProviderSaved?.();
          handleCloseModal();
        } else {
          toast.error(res.message || "Error al crear proveedor");
        }
      }
    } catch (error) {
      const action = isEditing ? 'actualizar' : 'crear';
      toast.error(`Error al ${action} el proveedor`);
      console.error(`Error ${action} proveedor:`, error);
    }
  });

  const buttonStyles = getModalButtonStyles("Proveedor");
  const currentButtonConfig = buttonStyles[mode];
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
          <Modal.Title>{isEditing ? "Editar proveedor" : "Nuevo proveedor"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <Controller
                  name="commercialName"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Nombre comercial *</Form.Label>
                      <Form.Control {...field} isInvalid={!!errors.commercialName} />
                      <Form.Control.Feedback type="invalid">
                        {errors.commercialName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="businessName"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Razón social *</Form.Label>
                      <Form.Control {...field} isInvalid={!!errors.businessName} />
                      <Form.Control.Feedback type="invalid">
                        {errors.businessName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="rfc"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>RFC *</Form.Label>
                      <Form.Control
                        {...field}
                        isInvalid={!!errors.rfc}
                        placeholder="Ej: ABC123456789"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.rfc?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="contactName"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Nombre contacto *</Form.Label>
                      <Form.Control {...field} isInvalid={!!errors.contactName} />
                      <Form.Control.Feedback type="invalid">
                        {errors.contactName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-4">
                <Controller
                  name="countryId"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>País *</Form.Label>
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
                      <Form.Control.Feedback type="invalid">
                        {errors.countryId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-4">
                <Controller
                  name="stateId"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Estado *</Form.Label>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.stateId}
                        disabled={loadingStates || !countrySelected}
                      >
                        <option value="">Seleccionar estado</option>
                        {states.map((state) => (
                          <option key={state._id} value={state._id}>
                            {state.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.stateId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-4">
                <Controller
                  name="municipalityId"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Ciudad *</Form.Label>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.municipalityId}
                        disabled={loadingMunicipalities || !stateSelected}
                      >
                        <option value="">Seleccionar ciudad</option>
                        {municipalities.map((municipality) => (
                          <option key={municipality._id} value={municipality._id}>
                            {municipality.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.municipalityId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-12">
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Dirección *</Form.Label>
                      <Form.Control {...field} isInvalid={!!errors.address} />
                      <Form.Control.Feedback type="invalid">
                        {errors.address?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Teléfono *</Form.Label>
                      <Form.Control {...field} isInvalid={!!errors.phone} />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Correo *</Form.Label>
                      <Form.Control {...field} isInvalid={!!errors.email} />
                      <Form.Control.Feedback type="invalid">
                        {errors.email?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>

              {/* Nuevos campos para información bancaria */}
              <div className="col-12">
                <h6 className="text-primary mb-3">Información Bancaria</h6>
              </div>
              <div className="col-md-6">
                <Controller
                  name="bank"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Banco *</Form.Label>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.bank}
                        disabled={loadingBanks}
                      >
                        <option value="">Seleccionar banco</option>
                        {banks.map((bank) => (
                          <option key={bank._id} value={bank._id}>
                            {bank.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.bank?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="bankAccountId"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Cuenta bancaria *</Form.Label>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.bankAccountId}
                        disabled={loadingBankAccounts || !bankSelected}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          // Autocompletar accountNumber y clabe cuando se selecciona una cuenta
                          if (e.target.value) {
                            const selectedAccount = bankAccounts.find(acc => acc._id === e.target.value);
                            if (selectedAccount) {
                              setValue("accountNumber", selectedAccount.accountNumber);
                              setValue("clabe", selectedAccount.clabe);
                            }
                          } else {
                            setValue("accountNumber", "");
                            setValue("clabe", "");
                          }
                        }}
                      >
                        <option value="">Seleccionar cuenta</option>
                        {bankAccounts.map((account) => (
                          <option key={account._id} value={account._id}>
                            {account.accountNumber} - CLABE: {account.clabe}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.bankAccountId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="accountNumber"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Número de cuenta *</Form.Label>
                      <Form.Control
                        {...field}
                        isInvalid={!!errors.accountNumber}
                        placeholder="Se autocompletará al seleccionar cuenta"
                        readOnly
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.accountNumber?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="clabe"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>CLABE *</Form.Label>
                      <Form.Control
                        {...field}
                        isInvalid={!!errors.clabe}
                        placeholder="Se autocompletará al seleccionar cuenta"
                        readOnly
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.clabe?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="referencia"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Referencia bancaria *</Form.Label>
                      <Form.Control
                        {...field}
                        isInvalid={!!errors.referencia}
                        placeholder="Ej: REF123456"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.referencia?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="sucursal"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Sucursal *</Form.Label>
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.sucursal}
                        disabled={loadingBranches}
                      >
                        <option value="">Seleccionar sucursal</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.sucursal?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>

              <div className="col-12">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Descripción</Form.Label>
                      <Form.Control as="textarea" rows={2} {...field} isInvalid={!!errors.description} />
                      <Form.Control.Feedback type="invalid">
                        {errors.description?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-12">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Form.Group className="form-check">
                      <Form.Check
                        type="checkbox"
                        label="Proveedor activo"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        isInvalid={!!errors.isActive}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.isActive?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            onClick={handleCloseModal}
            className="fw-medium px-4"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProviderModal;