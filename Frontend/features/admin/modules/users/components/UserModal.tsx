import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
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
import styles from "./users.module.css";

interface UsersModalProps {
  user?: User;
  roles: Role[];
  onSuccess?: () => void;
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

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const isValidSize =
          img.naturalWidth === 150 && img.naturalHeight === 150;
        resolve(isValidSize);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };

      img.src = url;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setError("Por favor selecciona un archivo JPG o PNG válido");
        return;
      }

      const isValidDimensions = await validateImageDimensions(file);
      if (!isValidDimensions) {
        setError(
          "La imagen debe tener exactamente 150x150 píxeles de resolución"
        );
        const fileInput = document.getElementById(
          "imageInput"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        return;
      }

      setSelectedImage(file);

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
    const fileInput = document.getElementById("imageInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
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

        await usersService.createUser(newUserData, selectedImage);
      }

      handleClose();
      onSuccess?.();
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
        dialogClassName="modal-90vh"
      >
        <Modal.Header closeButton className="border-0 pb-2 pt-3">
          <Modal.Title className="text-dark fs-5">
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-2">
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={clearError}
              className="mb-3 py-2"
            >
              <strong>Error:</strong> {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="text-dark mb-1">
                    Imagen de Perfil:
                  </Form.Label>
                  <div className="d-flex flex-column align-items-center gap-2">
                    {imagePreview ? (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "2px solid #e9ecef",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={imagePreview}
                          alt={`imagen de perfil de ${form.getValues(
                            "profile.nombreCompleto"
                          )}`}
                          fill
                          style={{
                            objectFit: "cover",
                          }}
                          sizes="40px"
                        />
                        <Button
                          variant="danger"
                          className="position-absolute top-0 end-0 rounded-circle p-1"
                          onClick={removeImage}
                          disabled={loading}
                          style={{ width: "24px", height: "24px" }}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-light border"
                        style={{
                          width: "100px",
                          height: "100px",
                          border: "2px dashed #dee2e6 !important",
                        }}
                      >
                        <Upload size={30} className="text-muted" />
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <Form.Control
                        type="file"
                        id="imageInput"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageChange}
                        disabled={loading}
                        className="d-none"
                      />
                      <Button
                        variant="outline-primary"
                        onClick={() =>
                          document.getElementById("imageInput")?.click()
                        }
                        disabled={loading}
                        className="px-2 py-1"
                      >
                        {imagePreview ? "Cambiar" : "Seleccionar"}
                      </Button>
                      {imagePreview && (
                        <Button
                          variant="outline-secondary"
                          onClick={removeImage}
                          disabled={loading}
                          className="px-2 py-1"
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                    <small
                      className="text-muted text-center"
                      style={{ fontSize: "0.75rem", lineHeight: "1.2" }}
                    >
                      <strong>Requisitos:</strong> 150x150px • JPG/PNG
                      únicamente
                    </small>
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-1">
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
                  <Form.Label className="text-dark mb-1">
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
                      <Form.Label className="text-dark mb-1">
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
                          className="position-absolute end-0 top-50 translate-middle-y p-1 border-0 text-muted"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          style={{ marginRight: "6px" }}
                        >
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
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
                      <Form.Label className="text-dark mb-1">
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
                          className="position-absolute end-0 top-50 translate-middle-y p-1 border-0 text-muted"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={loading}
                          style={{ marginRight: "6px" }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
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
                  <Form.Label className="text-dark mb-1">Rol:</Form.Label>
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
                  <Form.Label className="text-dark mb-1">
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

        <Modal.Footer className="border-0 pt-2 pb-3">
          <Button
            onClick={handleClose}
            disabled={loading}
            className={`px-3 py-1 ${styles.btnGrayLite}`}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="px-3 py-1"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" />
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
