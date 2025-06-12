import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building,
  Check,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Shield,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import {
  CreateUserFormData,
  createUserSchema,
} from "../../schemas/createUserSchema";
import {
  UpdateUserFormData,
  updateUserSchema,
} from "../../schemas/updateUserSchema";
import {
  usersService,
  type CreateUserData,
  type UpdateUserData,
} from "../../services/users";
import styles from "./UserModal.module.css";

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUserId?: string | null;
  users?: any[];
}

const UsersModal: React.FC<UsersModalProps> = ({
  isOpen,
  onClose,
  editingUserId,
  users = [],
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

  const roles = [
    { value: "", label: "Seleccionar rol" },
    { value: "684a5f1f0fa9dc00579ba18a", label: "Super Admin" },
    { value: "684a5f1f0fa9dc00579ba18b", label: "Gerente" },
    { value: "684a5f1f0fa9dc00579ba18c", label: "Egresos" },
    { value: "684a5f1f0fa9dc00579ba18d", label: "Asistente" },
  ];

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

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditing && editingUserId) {
        const updateData: UpdateUserData = {
          username: data.username,
          department: data.department,
          profile: {
            nombre: data.profile.nombre,
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
            nombre: createData.profile.nombre || "",
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

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContainer}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className="d-flex align-items-center">
              <div className={styles.headerIcon}>
                {isEditing ? (
                  <Edit size={24} className="text-white" />
                ) : (
                  <User size={24} className="text-white" />
                )}
              </div>
              <div className="ms-3">
                <h3 className={styles.modalTitle}>
                  {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
                </h3>
                <p className={styles.modalSubtitle}>
                  {isEditing
                    ? "Modifica la información del usuario"
                    : "Completa la información del usuario"}
                </p>
              </div>
            </div>
            <button
              className={styles.btnCloseCustom}
              onClick={handleClose}
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalBody}>
            {error && (
              <div
                className="alert alert-danger alert-dismissible mb-4"
                role="alert"
              >
                <strong>Error:</strong> {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={clearError}
                  aria-label="Close"
                />
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className={styles.formLabel}>
                    <User size={16} className="me-2 text-primary" />
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${styles.modernInput} ${
                      errors.username ? "is-invalid" : ""
                    }`}
                    placeholder="Ej: juan.perez"
                    {...register("username")}
                    disabled={loading}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">
                      {errors.username.message}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className={styles.formLabel}>
                    <User size={16} className="me-2 text-primary" />
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${styles.modernInput} ${
                      errors.profile?.nombreCompleto ? "is-invalid" : ""
                    }`}
                    placeholder="Ej: Juan Pérez García"
                    {...register("profile.nombreCompleto")}
                    disabled={loading}
                  />
                  {errors.profile?.nombreCompleto && (
                    <div className="invalid-feedback">
                      {errors.profile.nombreCompleto.message}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <>
                    <div className="col-md-6">
                      <label className={styles.formLabel}>
                        <Lock size={16} className="me-2 text-primary" />
                        Contraseña *
                      </label>
                      <div className={styles.passwordInput}>
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`form-control ${styles.modernInput} ${
                            isCreateFormErrors(errors) && errors.password
                              ? "is-invalid"
                              : ""
                          }`}
                          placeholder="Mínimo 6 caracteres"
                          {...register("password" as keyof CreateUserFormData)}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {isCreateFormErrors(errors) && errors.password && (
                        <div className="invalid-feedback">
                          {errors.password.message}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className={styles.formLabel}>
                        <Lock size={16} className="me-2 text-primary" />
                        Confirmar Contraseña *
                      </label>
                      <div className={styles.passwordInput}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`form-control ${styles.modernInput} ${
                            isCreateFormErrors(errors) && errors.confirmPassword
                              ? "is-invalid"
                              : ""
                          }`}
                          placeholder="Repite la contraseña"
                          {...register(
                            "confirmPassword" as keyof CreateUserFormData
                          )}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={loading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {isCreateFormErrors(errors) && errors.confirmPassword && (
                        <div className="invalid-feedback">
                          {errors.confirmPassword.message}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="col-md-6">
                  <label className={styles.formLabel}>
                    <Shield size={16} className="me-2 text-primary" />
                    Rol del Usuario *
                  </label>
                  <select
                    className={`form-select ${styles.modernInput} ${
                      errors.role ? "is-invalid" : ""
                    }`}
                    {...register("role")}
                    disabled={loading}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <div className="invalid-feedback">
                      {errors.role.message}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className={styles.formLabel}>
                    <Building size={16} className="me-2 text-primary" />
                    Departamento
                  </label>
                  <select
                    className={`form-select ${styles.modernInput}`}
                    {...register("department")}
                    disabled={loading}
                  >
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <div className={`form-check ${styles.modernCheckbox}`}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="userStatus"
                      {...register("profile.estatus")}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="userStatus">
                      <Check size={14} className="me-2" />
                      Usuario activo (puede iniciar sesión inmediatamente)
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      {isEditing ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      {isEditing ? (
                        <Edit size={16} className="me-2" />
                      ) : (
                        <User size={16} className="me-2" />
                      )}
                      {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersModal;
