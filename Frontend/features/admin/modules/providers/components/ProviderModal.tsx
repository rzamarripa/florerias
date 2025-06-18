import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { proveedorSchema, ProveedorFormData } from "../schemas/providerSchema";
import { Provider } from "../types";
import {
  getAllCountries,
  getStatesByCountry,
  getMunicipalitiesByState,
  createProvider,
  updateProvider,
} from "../services/providers";

interface ProviderModalButtonProps {
  mode: "create" | "edit";
  onProveedorSaved?: () => void;
  editingProveedor?: Provider | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const ProviderModal: React.FC<ProviderModalButtonProps> = ({
  mode,
  onProveedorSaved,
  editingProveedor = null,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const isEditing = mode === "edit";

  // Estados para selects dependientes
  const [countries, setCountries] = useState<{ _id: string; name: string }[]>([]);
  const [states, setStates] = useState<{ _id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ _id: string; name: string }[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      commercialName: "",
      businessName: "",
      contactName: "",
      countryId: "",
      stateId: "",
      municipalityId: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      isActive: true,
    },
    mode: "onChange",
  });

  const countrySelected = watch("countryId");
  const stateSelected = watch("stateId");

  // Cargar países al abrir modal
  useEffect(() => {
    if (showModal) {
      setLoadingCountries(true);
      getAllCountries()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setCountries(res.data);
          } else {
            setCountries([]);
          }
        })
        .catch(() => setCountries([]))
        .finally(() => setLoadingCountries(false));
    }
  }, [showModal]);

  // Cargar estados cuando cambia país
  useEffect(() => {
    if (countrySelected) {
      setLoadingStates(true);
      getStatesByCountry(countrySelected)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setStates(res.data);
          } else {
            setStates([]);
          }
        })
        .catch(() => setStates([]))
        .finally(() => setLoadingStates(false));
      setValue("stateId", "");
      setValue("municipalityId", "");
      setMunicipalities([]);
    }
  }, [countrySelected, setValue]);

  // Cargar municipios cuando cambia estado
  useEffect(() => {
    if (stateSelected) {
      setLoadingMunicipalities(true);
      getMunicipalitiesByState(stateSelected)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMunicipalities(res.data);
          } else {
            setMunicipalities([]);
          }
        })
        .catch(() => setMunicipalities([]))
        .finally(() => setLoadingMunicipalities(false));
      setValue("municipalityId", "");
    }
  }, [stateSelected, setValue]);

  // Cargar datos cuando está editando
  useEffect(() => {
    if (showModal) {
      if (isEditing && editingProveedor) {
        setValue("commercialName", editingProveedor.commercialName);
        setValue("businessName", editingProveedor.businessName);
        setValue("contactName", editingProveedor.contactName);
        setValue("countryId", typeof editingProveedor.countryId === "object" ? editingProveedor.countryId._id : editingProveedor.countryId);
        setValue("stateId", typeof editingProveedor.stateId === "object" ? editingProveedor.stateId._id : editingProveedor.stateId);
        setValue("municipalityId", typeof editingProveedor.municipalityId === "object" ? editingProveedor.municipalityId._id : editingProveedor.municipalityId);
        setValue("address", editingProveedor.address);
        setValue("phone", editingProveedor.phone);
        setValue("email", editingProveedor.email);
        setValue("description", editingProveedor.description || "");
        setValue("isActive", editingProveedor.isActive);
      } else {
        reset();
      }
    }
  }, [showModal, isEditing, editingProveedor, setValue, reset]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
    setStates([]);
    setMunicipalities([]);
  };

  const onSubmit = async (data: ProveedorFormData) => {
    try {
      if (isEditing && editingProveedor) {
        const res = await updateProvider(editingProveedor._id, data);
        if (res.success) {
          toast.success("Proveedor actualizado exitosamente");
          onProveedorSaved?.();
          handleCloseModal();
        } else {
          toast.error(res.message || "Error al actualizar proveedor");
        }
      } else {
        const res = await createProvider(data);
        if (res.success) {
          toast.success("Proveedor creado exitosamente");
          onProveedorSaved?.();
          handleCloseModal();
        } else {
          toast.error(res.message || "Error al crear proveedor");
        }
      }
    } catch (error) {
      const action = isEditing ? 'actualizar' : 'crear';
      const errorMessage = `Error al ${action} el proveedor`;
      toast.error(errorMessage);
      console.error(`Error ${action} proveedor:`, error);
    }
  };

  return (
    <>
      {mode === "create" ? (
        <Button onClick={handleOpenModal} {...buttonProps}>
          <Plus size={18} className="me-1" /> Nuevo proveedor
        </Button>
      ) : (
        <Button variant="outline-primary" size="sm" onClick={handleOpenModal} {...buttonProps}>
          <BsPencil size={16} />
        </Button>
      )}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Editar proveedor" : "Nuevo proveedor"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
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
              <div className="col-md-6">
                <Controller
                  name="countryId"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>País *</Form.Label>
                      <Form.Select {...field} isInvalid={!!errors.countryId} disabled={loadingCountries}>
                        <option value="">Selecciona un país</option>
                        {loadingCountries ? (
                          <option>Cargando...</option>
                        ) : (
                          countries.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))
                        )}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.countryId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="stateId"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Estado *</Form.Label>
                      <Form.Select {...field} isInvalid={!!errors.stateId} disabled={loadingStates || !countrySelected}>
                        <option value="">Selecciona un estado</option>
                        {loadingStates ? (
                          <option>Cargando...</option>
                        ) : (
                          states.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))
                        )}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.stateId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-6">
                <Controller
                  name="municipalityId"
                  control={control}
                  render={({ field }) => (
                    <Form.Group>
                      <Form.Label>Municipio *</Form.Label>
                      <Form.Select {...field} isInvalid={!!errors.municipalityId} disabled={loadingMunicipalities || !stateSelected}>
                        <option value="">Selecciona un municipio</option>
                        {loadingMunicipalities ? (
                          <option>Cargando...</option>
                        ) : (
                          municipalities.map((m) => (
                            <option key={m._id} value={m._id}>{m.name}</option>
                          ))
                        )}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.municipalityId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  )}
                />
              </div>
              <div className="col-md-12">
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
              <div className="col-md-12">
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
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting || !isValid}>
                {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProviderModal;