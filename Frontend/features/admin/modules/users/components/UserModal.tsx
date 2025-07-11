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
  const [removedExistingImage, setRemovedExistingImage] = useState<boolean>(false);
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);

  const isEditing = Boolean(user);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      profile: {
        name: "",
        lastName: "",
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



  // Función para obtener la URL de la imagen del usuario
  const getUserImageUrl = (user: User): string | null => {
    if (user?.profile?.image?.data) {
      const imageUrl = `data:${user.profile.image.contentType};base64,${user.profile.image.data}`;
      console.log('User image URL generated:', imageUrl.substring(0, 50) + '...');
      return imageUrl;
    }
    console.log('No user image data found');
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditing && user) {
        console.log('Opening modal in edit mode for user:', user.username);
        console.log('User profile image:', user.profile?.image);

        // Resetear el estado de imagen removida
        setRemovedExistingImage(false);

        let roleValue = "";
        if (user.role) {
          if (typeof user.role === 'object') {
            roleValue = user.role._id;
          } else {
            roleValue = user.role;
          }
        }

        setValue("username", user.username || "");
        setValue("email", user.email || "");
        setValue("phone", user.phone || "");
        setValue("password", "");
        setValue("confirmPassword", "");
        setValue("profile.name", user.profile?.name || "");
        setValue("profile.lastName", user.profile?.lastName || "");
        setValue("profile.fullName", user.profile?.fullName || "");
        setValue("profile.estatus", user.profile?.estatus ?? true);
        setValue("department", user.department || "");
        setValue("departmentId", user.departmentId || "");
        setValue("role", roleValue);

        // Configurar la imagen del usuario para edición
        const userImageUrl = getUserImageUrl(user);
        if (userImageUrl) {
          console.log('Setting image preview for user');
          setImagePreview(userImageUrl);
        } else {
          console.log('No image to set for user');
          setImagePreview(null);
        }
      } else {
        console.log('Opening modal in create mode');
        setRemovedExistingImage(false);
        reset({
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          profile: {
            name: "",
            lastName: "",
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

  useEffect(() => {
    // Cargar departamentos dinámicamente
    usersService.getAllDepartments().then((res) => {
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    });
  }, [isOpen]);

  // Efecto para actualizar automáticamente el fullName cuando cambien name o lastName
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'profile.name' || name === 'profile.lastName') {
        const name = form.getValues('profile.name') || '';
        const lastName = form.getValues('profile.lastName') || '';
        const fullName = getFullName(name, lastName);
        form.setValue('profile.fullName', fullName);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
    // Si estamos en modo edición y había una imagen existente, marcamos que se quitó
    if (isEditing && user?.profile?.image?.data) {
      setRemovedExistingImage(true);
    }
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

  const getFullName = (name: string, lastName: string) => {
    return `${name} ${lastName}`.trim();
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      if (isEditing && user) {
        const updateData = {
          username: data.username,
          email: data.email,
          phone: data.phone,
          departmentId: data.departmentId,
          department: data.department,
          profile: {
            name: data.profile.name,
            lastName: data.profile.lastName,
            fullName: getFullName(data.profile.name, data.profile.lastName),
            estatus: data.profile.estatus ?? true,
          },
          role: data.role,
        };

        // Si se quitó la imagen existente, pasamos null para indicar que se debe eliminar
        const imageToSend = removedExistingImage ? null : selectedImage;

        await usersService.updateUser(user._id, updateData, imageToSend);
        toast.success(`Usuario ${data.username} actualizado correctamente`);
      } else {
        const newUserData = {
          username: data.username,
          email: data.email,
          phone: data.phone,
          password: data.password!,
          departmentId: data.departmentId,
          department: data.department,
          profile: {
            name: data.profile.name,
            lastName: data.profile.lastName,
            fullName: getFullName(data.profile.name, data.profile.lastName),
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
    setRemovedExistingImage(false);
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
                        {isEditing && !selectedImage && user?.profile?.image?.data && (
                          <small className="text-info mt-1">
                            Imagen actual del usuario
                          </small>
                        )}
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
                      {isEditing && !imagePreview && !user?.profile?.image?.data && (
                        <br />
                      )}
                      {isEditing && !imagePreview && !user?.profile?.image?.data && (
                        <span className="text-info">No hay imagen de perfil</span>
                      )}
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
                    Email:
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Ingresa el email"
                    {...register("email")}
                    disabled={loading}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-1">
                    Teléfono:
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Ingresa el teléfono"
                    {...register("phone")}
                    disabled={loading}
                    isInvalid={!!errors.phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-1">
                    Nombre:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el nombre"
                    {...register("profile.name")}
                    disabled={loading}
                    isInvalid={!!errors.profile?.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.profile?.name?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-dark mb-1">
                    Apellido:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el apellido"
                    {...register("profile.lastName")}
                    disabled={loading}
                    isInvalid={!!errors.profile?.lastName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.profile?.lastName?.message}
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
                  <Form.Label className="text-dark mb-1">Departamento:</Form.Label>
                  <Controller
                    name="departmentId"
                    control={control}
                    rules={{ required: "El departamento es requerido" }}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        disabled={loading}
                        isInvalid={!!errors.departmentId}
                        onChange={e => {
                          field.onChange(e);
                          const dept = departments.find(d => d._id === e.target.value);
                          setValue("department", dept ? dept.name : "");
                        }}
                        value={field.value || ""}
                      >
                        <option value="">Selecciona un departamento</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.departmentId?.message}
                  </Form.Control.Feedback>
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