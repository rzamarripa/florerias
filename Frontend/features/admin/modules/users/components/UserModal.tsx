import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { FieldErrors, useForm } from "react-hook-form";
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
} from "../services/users";

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUserId?: string | null;
  users?: any[];
  roles: Role[];
}

const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  editingUserId,
  users = [],
  roles,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditing = Boolean(editingUserId);
  const currentUser = isEditing
    ? users.find((u) => u._id === editingUserId)
    : null;

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
    if (isEditing && currentUser) {
      reset({
        username: currentUser.username || "",
        profile: {
          nombre: currentUser.profile?.nombre || "",
          nombreCompleto: currentUser.profile?.nombreCompleto || "",
          estatus: currentUser.profile?.estatus ?? true,
        },
        department: currentUser.department || "",
        role: currentUser.role?._id || "",
      });
    } else if (!isEditing) {
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
  }, [isEditing, currentUser, isOpen, reset]);

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

      if (isEditing && editingUserId) {
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

        await usersService.updateUser(editingUserId, updateData);
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

        await usersService.createUser(newUserData);
      }

      handleClose();
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
    onClose();
  };

  const clearError = () => {
    setError(null);
  };

  return (
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
                        {isCreateFormErrors(errors) && errors.password?.message}
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
                          isCreateFormErrors(errors) && !!errors.confirmPassword
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
  );
};

export default UsersModal;
