import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { SucursalFormData, sucursalSchema } from "../schemas/BranchSchema";
import { Sucursal } from "../types";

interface BranchModal {
  mode: "create" | "edit";
  onSucursalSaved?: () => void;
  editingSucursal?: Sucursal | null;
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
      razonSocial: "",
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

  // Observar cambios en país y estado para resetear campos dependientes
  const paisSeleccionado = watch("pais");
  const estadoSeleccionado = watch("estado");

  // Cargar datos cuando está editando
  useEffect(() => {
    if (showModal) {
      if (isEditing && editingSucursal) {
        // Cargar datos para edición
        setValue("nombre", editingSucursal.nombre);
        setValue("razonSocial", editingSucursal.razonSocial);
        setValue("marca", editingSucursal.marca);
        setValue("pais", editingSucursal.pais);
        setValue("estado", editingSucursal.estado);
        setValue("ciudad", editingSucursal.ciudad);
        setValue("direccion", editingSucursal.direccion);
        setValue("telefono", editingSucursal.telefono);
        setValue("correo", editingSucursal.correo);
        setValue("descripcion", editingSucursal.descripcion || "");
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

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: SucursalFormData) => {
    try {
        console.log(data)
      if (isEditing && editingSucursal) {

      } else {

      }
    } catch (error) {
      const action = isEditing ? 'actualizar' : 'crear';
      const errorMessage =
        error instanceof Error ? error.message : `Error al ${action} la sucursal`;
      toast.error(errorMessage);
      console.error(`Error ${action} sucursal:`, error);
    }
  };

  const razonesSociales = [
    "Razón social SA de CV",
    "Empresa Nacional S.A.",
    "Corporativo Internacional S. de R.L.",
    "Grupo Empresarial México S.A.P.I.",
  ];

  const marcas = [
    "Marca Principal",
    "Marca Secundaria", 
    "Marca Premium",
    "Marca Económica",
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
      )
    },
    edit: {
      variant: "light",
      size: "sm" as const,
      className: "btn-icon rounded-circle",
      title: "Editar sucursal",
      children: <BsPencil size={16} />
    }
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

      {/* Modal */}
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
                      >
                        <option value="">Seleccionar marca</option>
                        {marcas.map((marca) => (
                          <option key={marca} value={marca}>
                            {marca}
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
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
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

export default BranchModal;