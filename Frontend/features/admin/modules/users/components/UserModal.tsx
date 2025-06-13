import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Plus, Upload, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { FieldErrors, useForm } from "react-hook-form";
import { BsPencil } from "react-icons/bs";
import { Role } from "../../roles/services/role";
import {
  CreateUserFormData,
  createUserSchema,
} from "../schemas/createUserSchema";
import {
  UpdateUserFormData,
  updateUserSchema,
} from "../schemas/updateUserSchema";
import {
  usersService,
  type CreateUserData,
  type UpdateUserData,
  type User,
} from "../services/users";

interface UsersModalProps {
  user?: User; // Usuario a editar (undefined para crear)
  roles: Role[];
  onSuccess?: () => void; // Callback para refrescar datos después de crear/actualizar
}

const UsersModal: React.FC<UsersModalProps> = ({ user, roles, onSuccess }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isEditing = Boolean(user);

  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      username: "",
      ...(isEditing ? {} : { password: "", confirmPassword: "" }),
      profile: {
        nombre: "",
        nombreCompleto: "",
        estatus: true,
      },
      department: "",
      role: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  const isCreateFormErrors = (
    errors: any
  ): errors is FieldErrors<CreateUserFormData> => {
    return !isEditing;
  };

  const departments = [
    { value: "", label: "Seleccionar departamento" },
    { value: "ADMINISTRACION RIF", label: "Administración RIF" },
    { value: "CONTABILIDAD", label: "Contabilidad" },
    {
      value: "CONSTRU ACCESORIOS DEL RIO",
      label: "Construcción Accesorios del Río",
    },
    { value: "RECURSOS HUMANOS", label: "Recursos Humanos" },
    { value: "VENTAS", label: "Ventas" },
  ];

  useEffect(() => {
    if (isOpen) {
      if (isEditing && user) {
        reset({
          username: user.username || "",
          profile: {
            nombre: user.profile?.nombre || "",
            nombreCompleto: user.profile?.nombreCompleto || "",
            estatus: user.profile?.estatus ?? true,
          },
          department: user.department || "",
          role: user.role?._id || "",
        });
        // Si el usuario tiene imagen, mostrar preview
        if (user.profile?.image) {
          setImagePreview(user.profile.image);
        }
      } else {
        reset({
          username: "",
          password: "",
          confirmPassword: "",
          profile: {
            nombre: "",
            nombreCompleto: "",
            estatus: true,
          },
          department: "",
          role: "",
        });
      }
    }
  }, [isOpen, isEditing, user, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede ser mayor a 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFirstName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    const givenNames =
      parts.length > 3 ? parts.slice(0, 2).join(" ") : parts[0];
    return givenNames;
  };

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditing && user) {
        const updateData: UpdateUserData = {
          username: data.username,
          department: data.department,
          profile: {
            nombre: getFirstName(data.profile.nombreCompleto),
            nombreCompleto: data.profile.nombreCompleto,
            estatus: data.profile.estatus,
          },
          role: data.role,
        };

        // Solo pasar la imagen si realmente hay una nueva imagen seleccionada
        await usersService.updateUser(user._id, updateData, selectedImage);
      } else {
        const createData = data as CreateUserFormData;
        const newUserData: CreateUserData = {
          username: createData.username,
          password: createData.password,
          department: createData.department,
          profile: {
            nombre: getFirstName(createData.profile.nombreCompleto) || "",
            nombreCompleto: createData.profile.nombreCompleto,
            estatus: createData.profile.estatus,
          },
          role: createData.role,
        };

        // Solo pasar la imagen si realmente hay una imagen seleccionada
        await usersService.createUser(newUserData, selectedImage);
      }

      handleClose();
      onSuccess?.(); // Callback para refrescar datos
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedImage(null);
    setImagePreview(null);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <>
      {isEditing ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Editar usuario"
          onClick={(e) => {
            e.preventDefault();
            handleOpen();
          }}
          tabIndex={0}
        >
          <BsPencil size={16} />
        </button>
      ) : (
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2 text-nowrap px-3"
          onClick={handleOpen}
        >
          <Plus size={18} />
          Agregar Usuario
        </Button>
      )}

      <Modal
        show={isOpen}
        onHide={handleClose}
        size="lg"
        centered
        backdrop="static"
        keyboard={!loading}
      >
        <Modal.Header closeButton className="border-0.5 pb-3">
          <Modal.Title className="text-dark">
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4">
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={clearError}
              className="mb-4"
            >
              <strong>Error:</strong> {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row className="g-4">
              {/* Sección de imagen */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="text-dark mb-2">
                    Imagen de Perfil:
                  </Form.Label>
                  <div className="d-flex flex-column align-items-center gap-3">
                    {imagePreview ? (
                      <div className="position-relative">
                        <img
                          srcSet={imagePreview}
                          alt="Preview"
                          className="rounded-circle"
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            border: "3px solid #dee2e6"
                          }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 rounded-circle p-1"
                          onClick={removeImage}
                          disabled={loading}
                          style={{ width: "30px", height: "30px" }}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-light border"
                        style={{
                          width: "120px",
                          height: "120px",
                          border: "2px dashed #dee2e6 !important"
                        }}
                      >
                        <Upload size={40} className="text-muted" />
                      </div>
                    )}
                    
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="file"
                        id="imageInput"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading}
                        className="d-none"
                      />
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => document.getElementById('imageInput')?.click()}
                        disabled={loading}
                      >
                        {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                      </Button>
                      {imagePreview && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={removeImage}
                          disabled={loading}
                        >
                          Quitar imagen
                        </Button>
                      )}
                    </div>
                    <small className="text-muted">
                      Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
                    </small>
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-2">
                    Nombre de Usuario:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el nombre de usuario"
                    {...register("username")}
                    disabled={loading}
                    isInvalid={!!errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-2">
                    Nombre Completo:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el nombre completo"
                    {...register("profile.nombreCompleto")}
                    disabled={loading}
                    isInvalid={!!errors.profile?.nombreCompleto}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.profile?.nombreCompleto?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {!isEditing && (
                <>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-dark mb-2">
                        Contraseña:
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder="Ingresa la contraseña"
                          {...register("password" as keyof CreateUserFormData)}
                          disabled={loading}
                          isInvalid={
                            isCreateFormErrors(errors) && !!errors.password
                          }
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y p-2 border-0 text-muted"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          style={{ marginRight: "8px" }}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {isCreateFormErrors(errors) &&
                            errors.password?.message}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-dark mb-2">
                        Confirmar Contraseña:
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirma la contraseña"
                          {...register(
                            "confirmPassword" as keyof CreateUserFormData
                          )}
                          disabled={loading}
                          isInvalid={
                            isCreateFormErrors(errors) &&
                            !!errors.confirmPassword
                          }
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y p-2 border-0 text-muted"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={loading}
                          style={{ marginRight: "8px" }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {isCreateFormErrors(errors) &&
                            errors.confirmPassword?.message}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-2">Rol:</Form.Label>
                  <Form.Select
                    {...register("role")}
                    disabled={loading}
                    isInvalid={!!errors.role}
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.role?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-2">
                    Departamento:
                  </Form.Label>
                  <Form.Select {...register("department")} disabled={loading}>
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="px-4"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="px-4"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {isEditing ? "Actualizando..." : "Guardando..."}
              </>
            ) : (
              <>{isEditing ? "Actualizar" : "Guardar"}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UsersModal;