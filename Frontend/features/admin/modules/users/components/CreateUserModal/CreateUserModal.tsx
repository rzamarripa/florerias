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
import {
  usersService,
  type CreateUserData,
  type UpdateUserData,
} from "../../services/users";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUserId?: string | null;
  users?: any[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  editingUserId,
  users = [],
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingUserId);
  const currentUser = isEditing
    ? users.find((u) => u._id === editingUserId)
    : null;

  const [formData, setFormData] = useState({
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del usuario cuando estamos editando
  useEffect(() => {
    if (isEditing && currentUser) {
      setFormData({
        username: currentUser.username || "",
        password: "", // No pre-llenar password para edición
        confirmPassword: "",
        profile: {
          nombre: currentUser.profile?.nombre || "",
          nombreCompleto: currentUser.profile?.nombreCompleto || "",
          estatus: currentUser.profile?.estatus ?? true,
        },
        department: currentUser.department || "",
        role: currentUser.role?._id || "",
      });
    } else {
      // Resetear formulario para crear nuevo usuario
      setFormData({
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
  }, [isEditing, currentUser, isOpen]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    } else if (formData.username.length < 3) {
      newErrors.username =
        "El nombre de usuario debe tener al menos 3 caracteres";
    }

    // Validación de contraseña solo para crear nuevos usuarios
    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = "La contraseña es requerida";
      } else if (formData.password.length < 6) {
        newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirma tu contraseña";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }

    if (!formData.profile.nombreCompleto.trim()) {
      newErrors.nombreCompleto = "El nombre completo es requerido";
    }

    if (!formData.role) {
      newErrors.role = "Selecciona un rol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      if (isEditing && editingUserId) {
        // Actualizar usuario - excluir campos de contraseña para actualización
        const updateData: UpdateUserData = {
          username: formData.username,
          department: formData.department,
          profile: {
            nombre: formData.profile.nombre,
            nombreCompleto: formData.profile.nombreCompleto,
            estatus: formData.profile.estatus,
          },
          role: formData.role,
        };

        await usersService.updateUser(editingUserId, updateData);
      } else {
        // Crear nuevo usuario
        const createData: CreateUserData = {
          username: formData.username,
          password: formData.password,
          department: formData.department,
          profile: {
            nombre: formData.profile.nombre,
            nombreCompleto: formData.profile.nombreCompleto,
            estatus: formData.profile.estatus,
          },
          role: formData.role,
        };

        await usersService.createUser(createData);
      }

      // Si llegamos aquí, la operación fue exitosa
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
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
    setErrors({});
    setError(null);
    setLoading(false);
    onClose();
  };

  const updateField = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Limpiar error del campo cuando el usuario comience a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-content">
          <div className="modal-header">
            <div className="d-flex align-items-center">
              <div className="header-icon">
                {isEditing ? (
                  <Edit size={24} className="text-white" />
                ) : (
                  <User size={24} className="text-white" />
                )}
              </div>
              <div className="ms-3">
                <h3 className="modal-title">
                  {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
                </h3>
                <p className="modal-subtitle">
                  {isEditing
                    ? "Modifica la información del usuario"
                    : "Completa la información del usuario"}
                </p>
              </div>
            </div>
            <button
              className="btn-close-custom"
              onClick={handleClose}
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
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

            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label">
                    <User size={16} className="me-2 text-primary" />
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    className={`form-control modern-input ${
                      errors.username ? "is-invalid" : ""
                    }`}
                    placeholder="Ej: juan.perez"
                    value={formData.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    disabled={loading}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <User size={16} className="me-2 text-primary" />
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    className={`form-control modern-input ${
                      errors.nombreCompleto ? "is-invalid" : ""
                    }`}
                    placeholder="Ej: Juan Pérez García"
                    value={formData.profile.nombreCompleto}
                    onChange={(e) =>
                      updateField("profile.nombreCompleto", e.target.value)
                    }
                    disabled={loading}
                  />
                  {errors.nombreCompleto && (
                    <div className="invalid-feedback">
                      {errors.nombreCompleto}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label">
                        <Lock size={16} className="me-2 text-primary" />
                        Contraseña *
                      </label>
                      <div className="password-input">
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`form-control modern-input ${
                            errors.password ? "is-invalid" : ""
                          }`}
                          placeholder="Mínimo 6 caracteres"
                          value={formData.password}
                          onChange={(e) =>
                            updateField("password", e.target.value)
                          }
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="password-toggle"
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
                      {errors.password && (
                        <div className="invalid-feedback">
                          {errors.password}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        <Lock size={16} className="me-2 text-primary" />
                        Confirmar Contraseña *
                      </label>
                      <div className="password-input">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`form-control modern-input ${
                            errors.confirmPassword ? "is-invalid" : ""
                          }`}
                          placeholder="Repite la contraseña"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            updateField("confirmPassword", e.target.value)
                          }
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="password-toggle"
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
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="col-md-6">
                  <label className="form-label">
                    <Shield size={16} className="me-2 text-primary" />
                    Rol del Usuario *
                  </label>
                  <select
                    className={`form-select modern-input ${
                      errors.role ? "is-invalid" : ""
                    }`}
                    value={formData.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    disabled={loading}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <div className="invalid-feedback">{errors.role}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    <Building size={16} className="me-2 text-primary" />
                    Departamento
                  </label>
                  <select
                    className="form-select modern-input"
                    value={formData.department}
                    onChange={(e) => updateField("department", e.target.value)}
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
                  <div className="form-check modern-checkbox">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="userStatus"
                      checked={formData.profile.estatus}
                      onChange={(e) =>
                        updateField("profile.estatus", e.target.checked)
                      }
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="userStatus">
                      <Check size={14} className="me-2" />
                      Usuario activo (puede iniciar sesión inmediatamente)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
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

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1055;
          padding: 1rem;
        }

        .modal-container {
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
          padding: 2rem;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-icon {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 12px;
          backdrop-filter: blur(10px);
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          color: white;
        }

        .modal-subtitle {
          font-size: 0.9rem;
          margin: 0.25rem 0 0 0;
          opacity: 0.9;
          color: rgba(255, 255, 255, 0.8);
        }

        .btn-close-custom {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 10px;
          padding: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .btn-close-custom:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .btn-close-custom:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-body {
          padding: 2rem;
        }

        .form-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          font-size: 0.9rem;
        }

        .modern-input {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: #fafafa;
        }

        .modern-input:focus {
          border-color: #0891b2;
          box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
          background: white;
        }

        .modern-input.is-invalid {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .modern-input:disabled {
          background-color: #f3f4f6;
          opacity: 0.6;
          cursor: not-allowed;
        }

        .password-input {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .password-toggle:hover:not(:disabled) {
          background: #f3f4f6;
          color: #374151;
        }

        .password-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modern-checkbox {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .modern-checkbox:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .form-check-input:checked {
          background-color: #0891b2;
          border-color: #0891b2;
        }

        .form-check-input:focus {
          box-shadow: 0 0 0 0.2rem rgba(8, 145, 178, 0.25);
        }

        .form-check-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .btn {
          font-weight: 600;
          transition: all 0.2s;
          border: none;
          font-size: 0.9rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(8, 145, 178, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-outline-secondary {
          border: 2px solid #e5e7eb;
          color: #6b7280;
          background: white;
        }

        .btn-outline-secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
        }

        .btn-outline-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .invalid-feedback {
          font-size: 0.8rem;
          color: #ef4444;
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .text-primary {
          color: #0891b2 !important;
        }

        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }

        @media (max-width: 768px) {
          .modal-header {
            padding: 1.5rem;
          }

          .modal-body {
            padding: 1.5rem;
          }

          .modal-footer {
            padding: 1rem 1.5rem;
            flex-direction: column;
          }

          .modal-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateUserModal;
