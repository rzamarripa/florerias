"use client";

import AppLogo from "@/components/ui/AppLogo";
import { author, currentYear } from "@/helpers";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  FormControl,
  FormLabel,
  Row,
  Spinner,
} from "react-bootstrap";
import { TbLockPassword, TbMail } from "react-icons/tb";
import { AuthError, loginService } from "./services/auth";

const SignInPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setUser, setLoading } = useUserSessionStore();
  const { setAllowedModules } = useUserModulesStore();
  const { setUserRole } = useUserRoleStore();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 3) {
      setError("La contraseña debe tener al menos 3 caracteres");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await loginService({
        username: formData.username,
        password: formData.password,
      });

      if (response.success && response.data) {
        console.debug("Login exitoso, guardando datos:", {
          user: response.data.user,
          token: response.data.token ? "Presente" : "Ausente",
          role: response.data.role,
          allowedModules: response.data.allowedModules,
        });

        setUser(response.data.user, response.data.token);
        setUserRole(response.data.role);
        setAllowedModules(response.data.allowedModules);

        // Verificar que el token se guardó correctamente
        const storedToken = useUserSessionStore.getState().token;
        console.debug(
          "Token almacenado en el store:",
          storedToken ? "Presente" : "Ausente"
        );

        // Redirigir según el rol del usuario
        const userRole = response.data.role;
        if (userRole === "Cajero" || userRole === "Redes") {
          router.push("/sucursal/ventas");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(response.message || "Error en el inicio de sesión");
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Error inesperado. Intenta nuevamente.");
      }
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="auth-box d-flex align-items-center">
      <div className="container-xxl">
        <Row className="align-items-center justify-content-center">
          <Col xl={10}>
            <Card className="rounded-4">
              <Row className="justify-content-between g-0">
                <Col lg={6}>
                  <div className="card-body">
                    <div className="auth-brand text-center mb-4">
                      <AppLogo />
                      <h4 className="fw-bold mt-4">Bienvenido a FloriSoft</h4>
                      <p className="text-muted w-lg-75 mx-auto">
                        Inicia sesión para acceder al panel de administración.
                      </p>
                    </div>

                    {error && (
                      <Alert variant="danger" className="mb-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-2">
                            <i className="text-danger fs-5">⚠️</i>
                          </div>
                          <div>{error}</div>
                        </div>
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <FormLabel htmlFor="username" className="form-label">
                          Nombre de Usuario{" "}
                          <span className="text-danger">*</span>
                        </FormLabel>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <TbMail className="text-muted fs-xl" />
                          </span>
                          <FormControl
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Tu nombre de usuario"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <FormLabel htmlFor="password" className="form-label">
                          Contraseña <span className="text-danger">*</span>
                        </FormLabel>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <TbLockPassword className="text-muted fs-xl" />
                          </span>
                          <FormControl
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="d-grid">
                        <Button
                          type="submit"
                          variant="primary"
                          style={{
                            borderRadius: "10px",
                            padding: "12px 24px",
                            fontWeight: "600",
                          }}
                          className="fw-semibold py-2"
                          disabled={
                            isSubmitting ||
                            !formData.username ||
                            !formData.password
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Iniciando sesión...
                            </>
                          ) : (
                            "Iniciar Sesión"
                          )}
                        </Button>
                      </div>
                    </Form>

                    <p className="text-center text-muted mt-4 mb-0">
                      © 2014 - {currentYear} FloriSoft — by{" "}
                      <span className="fw-semibold">Masoft</span>
                    </p>
                  </div>
                </Col>
                <Col lg={6} className="d-none d-lg-block">
                  <div className="h-100 position-relative card-side-img rounded-end-4 rounded-end rounded-0 overflow-hidden">
                    <div className="p-4 card-img-overlay rounded-4 rounded-start-0 d-flex align-items-end justify-content-center"></div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SignInPage;
