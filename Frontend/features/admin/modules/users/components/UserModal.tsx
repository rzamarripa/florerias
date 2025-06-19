import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { BsPencil } from "react-icons/bs";
import { toast } from "react-toastify";
import { Role } from "../../roles/types";
import { UserFormData, userFormSchema } from "../schemas/userSchema"; 
import { usersService } from "../services/users";
import type { User } from "../types";

interface UsersModalProps {
  user?: User;
  roles: Role[];
  onSuccess?: () => void;
}

const UsersModal: React.FC<UsersModalProps> = ({ user, roles, onSuccess }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isEditing = Boolean(user);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "", 
      confirmPassword: "", 
      profile: {
        name: "",
        fullName: "",
        estatus: true,
      },
      department: "",
      role: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue
  } = form;

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
        let roleValue = "";
        if (user.role) {
          if (typeof user.role === 'object') {
            roleValue = user.role._id;
          } else {
            roleValue = user.role;
          }
        }

        setValue("username", user.username || "");
        setValue("password", "");
        setValue("confirmPassword", "");
        setValue("profile.name", user.profile?.name || "");
        setValue("profile.fullName", user.profile?.fullName || "");
        setValue("profile.estatus", user.profile?.estatus ?? true);
        setValue("department", user.department || "");
        setValue("role", roleValue);
        
        if (typeof user?.profile?.image === "string") {
          setImagePreview(user.profile.image);
        }
      } else {
        reset({
          username: "",
          password: "", 
          confirmPassword: "", 
          profile: {
            name: "",
            fullName: "",
            estatus: true,
          },
          department: "",
          role: "",
        });
        setImagePreview(null);
      }
    }
  }, [isOpen, isEditing, user, reset, setValue]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error("Por favor selecciona un archivo JPG o PNG válido");
        const fileInput = document.getElementById("imageInput") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        return;
      }

      const maxSize = 1048576;
      if (file.size > maxSize) {
        toast.error("El tamaño de la imagen no debe exceder 1MB");
        const fileInput = document.getElementById("imageInput") as HTMLInputElement;
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

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      if (isEditing && user) {
        const updateData = {
          username: data.username,
          department: data.department,
          profile: {
            name: getFirstName(data.profile.name),
            fullName: data.profile.fullName,
            estatus: data.profile.estatus ?? true,
          },
          role: data.role,
        };

        await usersService.updateUser(user._id, updateData, selectedImage);
        toast.success(`Usuario ${data.username} actualizado correctamente`);
      } else {
        const newUserData = {
          username: data.username,
          password: data.password!, 
          department: data.department,
          profile: {
            name: getFirstName(data.profile.name) || "",
            fullName: data.profile.fullName,
            estatus: data.profile.estatus ?? true,
          },
          role: data.role,
        };

        await usersService.createUser(newUserData, selectedImage);
        toast.success(`Usuario ${data.username} creado correctamente`);
      }

      handleClose();
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      if (isEditing) {
        toast.error(`Error al actualizar el usuario: ${errorMessage}`);
      } else {
        toast.error(`Error al crear el usuario: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
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

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body className="px-4 py-2">
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="text-dark mb-1">
                    Imagen de Perfil
                  </Form.Label>
                  <div className="d-flex flex-column align-items-center gap-2">
                    {imagePreview ? (
                      <div className="d-flex flex-column align-items-center position-relative">
                        <div
                          style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "2px solid #e9ecef",
                          }}
                        >
                          <Image
                            src={imagePreview}
                            alt={`imagen de perfil de ${form.getValues(
                              "profile.fullName"
                            )}`}
                            fill
                            style={{
                              objectFit: "cover",
                            }}
                            sizes="120px"
                          />
                        </div>
                        <Button
                          variant="link"
                          className="position-absolute text-danger p-0"
                          onClick={removeImage}
                          disabled={loading}
                          style={{ 
                            top: "-10px", 
                            right: "-10px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "white",
                            border: "1px solid #dc3545",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          type="button"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light border"
                        style={{
                          width: "120px",
                          height: "120px",
                          borderRadius: "50%",
                          border: "2px dashed #dee2e6 !important",
                        }}
                      >
                        <Upload size={40} className="text-muted" />
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
                        type="button"
                      >
                        {imagePreview ? "Cambiar" : "Seleccionar"}
                      </Button>
                      {imagePreview && (
                        <Button
                          variant="outline-secondary"
                          onClick={removeImage}
                          disabled={loading}
                          className="px-2 py-1"
                          type="button"
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                    <small
                      className="text-muted text-center"
                      style={{ fontSize: "0.75rem", lineHeight: "1.2" }}
                    >
                      <strong>Requisitos:</strong> Máximo 1MB • JPG/PNG únicamente
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
                    {...register("profile.fullName")}
                    disabled={loading}
                    isInvalid={!!errors.profile?.fullName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.profile?.fullName?.message}
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
                          {...register("password")}
                          disabled={loading}
                          isInvalid={!!errors.password}
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y p-1 border-0 text-muted"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          style={{ marginRight: "6px" }}
                          type="button"
                        >
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.password?.message}
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
                          {...register("confirmPassword")}
                          disabled={loading}
                          isInvalid={!!errors.confirmPassword}
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y p-1 border-0 text-muted"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={loading}
                          style={{ marginRight: "6px" }}
                          type="button"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.confirmPassword?.message}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>
                </>
              )}

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-1">Rol:</Form.Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
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
                    )}
                  />
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
          </Modal.Body>

          <Modal.Footer className="border-0 pt-2 pb-3">
            <Button
              type="button"
              variant="light"
              onClick={handleClose}
              className="fw-medium px-4"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
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
        </Form>
      </Modal>
    </>
  );
};

export default UsersModal;