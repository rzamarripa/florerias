import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { proveedorSchema, ProveedorFormData } from "../schemas/providerSchema";

interface Proveedor extends ProveedorFormData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface ProveedorModalButtonProps {
  mode: "create" | "edit";
  onProveedorSaved?: () => void;
  editingProveedor?: Proveedor | null;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const ProviderModal: React.FC<ProveedorModalButtonProps> = ({
  mode,
  onProveedorSaved,
  editingProveedor = null,
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
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombreComercial: "",
      razonSocial: "",
      nombreContacto: "",
      pais: "",
      estado: "",
      ciudad: "",
      direccion: "",
      telefono: "",
      correo: "",
      descripcion: "",
      status: true,
    },
    mode: "onChange",
  });

  // Observar cambios en país y estado para resetear campos dependientes
  const paisSeleccionado = watch("pais");
  const estadoSeleccionado = watch("estado");

  // Cargar datos cuando está editando
  useEffect(() => {
    if (showModal) {
      if (isEditing && editingProveedor) {
        // Cargar datos para edición
        setValue("nombreComercial", editingProveedor.nombreComercial);
        setValue("razonSocial", editingProveedor.razonSocial);
        setValue("nombreContacto", editingProveedor.nombreContacto);
        setValue("pais", editingProveedor.pais);
        setValue("estado", editingProveedor.estado);
        setValue("ciudad", editingProveedor.ciudad);
        setValue("direccion", editingProveedor.direccion);
        setValue("telefono", editingProveedor.telefono);
        setValue("correo", editingProveedor.correo);
        setValue("descripcion", editingProveedor.descripcion || "");
        setValue("status", editingProveedor.status);
      } else {
        // Resetear para creación
        reset();
      }
    }
  }, [showModal, isEditing, editingProveedor, setValue, reset]);

  // Resetear estado y ciudad cuando cambia el país
  useEffect(() => {
    if (paisSeleccionado) {
      setValue("estado", "");
      setValue("ciudad", "");
    }
  }, [paisSeleccionado, setValue]);

  // Resetear ciudad cuando cambia el estado
  useEffect(() => {
    if (estadoSeleccionado) {
      setValue("ciudad", "");
    }
  }, [estadoSeleccionado, setValue]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: ProveedorFormData) => {
    try {
      // Mock de operación (sin servicios reales)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay

      if (isEditing && editingProveedor) {
        // Mock actualizar proveedor
        console.log("Updating proveedor:", { ...editingProveedor, ...data });
        toast.success("Proveedor actualizado exitosamente");
      } else {
        // Mock crear proveedor
        console.log("Creating proveedor:", data);
        toast.success("Proveedor creado exitosamente");
      }

      onProveedorSaved?.();
      handleCloseModal();
    } catch (error) {
      const action = isEditing ? 'actualizar' : 'crear';
      const errorMessage = `Error al ${action} el proveedor`;
      toast.error(errorMessage);
      console.error(`Error ${action} proveedor:`, error);
    }
  };

  // Opciones para los select (en una aplicación real, estos vendrían de APIs)
  const nombresComerciales = [
    "MaSoft",
    "TechCorp",
    "SoftSolutions",
    "DataPro",
    "InfoSystems",
  ];

  const razonesSociales = [
    "Servicios Informáticos SA de CV",
    "Tecnología Avanzada S.A.",
    "Soluciones Digitales S. de R.L.",
    "Sistemas Integrados S.A.P.I.",
    "Desarrollo de Software S.A.",
  ];

  const paises = [
    "México",
    "Estados Unidos",
    "Canadá",
    "España",
    "Colombia",
  ];

  const estadosPorPais: { [key: string]: string[] } = {
    México: [
      "Jalisco",
      "Ciudad de México",
      "Nuevo León",
      "Estado de México",
      "Puebla",
      "Guanajuato",
    ],
    "Estados Unidos": [
      "California",
      "Texas", 
      "Florida",
      "New York",
      "Illinois",
    ],
    Canadá: [
      "Ontario",
      "Quebec",
      "British Columbia",
      "Alberta",
    ],
    España: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Sevilla",
    ],
    Colombia: [
      "Bogotá",
      "Antioquia",
      "Valle del Cauca",
      "Atlántico",
    ],
  };

  const ciudadesPorEstado: { [key: string]: string[] } = {
    Jalisco: ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"],
    "Ciudad de México": ["Benito Juárez", "Miguel Hidalgo", "Cuauhtémoc", "Coyoacán"],
    "Nuevo León": ["Monterrey", "San Pedro Garza García", "Guadalupe", "Apodaca"],
    California: ["Los Angeles", "San Francisco", "San Diego", "Sacramento"],
    Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
    Ontario: ["Toronto", "Ottawa", "Hamilton", "London"],
    Madrid: ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada"],
    Bogotá: ["Bogotá", "Soacha", "Zipaquirá", "Facatativá"],
  };

  // Configuración por defecto del botón según el modo
  const defaultButtonProps = {
    create: {
      variant: "primary",
      className: "d-flex align-items-center gap-2 text-nowrap px-3",
      title: "Nuevo Proveedor",
      children: (
        <>
          <Plus size={18} />
          Nuevo Proveedor
        </>
      )
    },
    edit: {
      variant: "light",
      size: "sm" as const,
      className: "btn-icon rounded-circle",
      title: "Editar proveedor",
      children: <BsPencil size={16} />
    }
  };

  const currentButtonConfig = defaultButtonProps[mode];
  const finalButtonProps = { ...currentButtonConfig, ...buttonProps };

  return (
    <>
      {/* Botón que abre el modal */}
      <Button
        variant={finalButtonProps.variant}
        size={finalButtonProps.size}
        className={finalButtonProps.className}
        title={finalButtonProps.title}
        onClick={handleOpenModal}
      >
        {finalButtonProps.children}
      </Button>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nombre comercial <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="nombreComercial"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.nombreComercial}
                      >
                        <option value="">Seleccionar nombre comercial</option>
                        {nombresComerciales.map((nombre) => (
                          <option key={nombre} value={nombre}>
                            {nombre}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombreComercial?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    Razón social <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="razonSocial"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.razonSocial}
                      >
                        <option value="">Seleccionar razón social</option>
                        {razonesSociales.map((razon) => (
                          <option key={razon} value={razon}>
                            {razon}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.razonSocial?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>
                Nombre contacto <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="nombreContacto"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    type="text"
                    placeholder="Nombre del contacto principal"
                    isInvalid={!!errors.nombreContacto}
                    {...field}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.nombreContacto?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>País</Form.Label>
                  <Controller
                    name="pais"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.pais}
                      >
                        <option value="">Seleccionar país</option>
                        {paises.map((pais) => (
                          <option key={pais} value={pais}>
                            {pais}
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
                  <Form.Label>Estado</Form.Label>
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.estado}
                        disabled={!paisSeleccionado}
                      >
                        <option value="">
                          {paisSeleccionado ? "Seleccionar estado" : "Primero selecciona un país"}
                        </option>
                        {(estadosPorPais[paisSeleccionado] || []).map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
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
                  <Form.Label>Ciudad</Form.Label>
                  <Controller
                    name="ciudad"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        isInvalid={!!errors.ciudad}
                        disabled={!estadoSeleccionado}
                      >
                        <option value="">
                          {estadoSeleccionado ? "Seleccionar ciudad" : "Primero selecciona un estado"}
                        </option>
                        {(ciudadesPorEstado[estadoSeleccionado] || []).map((ciudad) => (
                          <option key={ciudad} value={ciudad}>
                            {ciudad}
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
                    placeholder="Dirección completa del proveedor"
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
                    placeholder="Comentario opcional sobre el proveedor"
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
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
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
              ) : (
                isEditing ? "Actualizar" : "Guardar"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default ProviderModal;