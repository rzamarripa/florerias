"use client";

import AppLogo from "@/components/ui/AppLogo";
import { author, currentYear } from "@/helpers";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import Link from "next/link";
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

const SignIn = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await loginService({
        username: formData.username,
        password: formData.password,
      });

      if (response.success && response.data) {
        setUser(response.data.user, response.data.token);
        setUserRole(response.data.role);
        setAllowedModules(response.data.allowedModules);

        router.push("/dashboard");
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
                      <h4 className="fw-bold mt-4">Welcome to IN+</h4>
                      <p className="text-muted w-lg-75 mx-auto">
                        Let's get you signed in. Enter your username and
                        password to continue.
                      </p>
                    </div>

                    {/* Mostrar errores */}
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
                          Username <span className="text-danger">*</span>
                        </FormLabel>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <TbMail className="text-muted fs-xl" />
                          </span>
                          <FormControl
                            type="text"
                            id="username"
                            name="username"
                            placeholder="your-username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <FormLabel htmlFor="password" className="form-label">
                          Password <span className="text-danger">*</span>
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

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input form-check-input-light fs-14"
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={isSubmitting}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="rememberMe"
                          >
                            Keep me signed in
                          </label>
                        </div>

                        <Link
                          href="/auth-2/reset-password"
                          className="text-decoration-underline link-offset-3 text-muted"
                        >
                          Forgot Password?
                        </Link>
                      </div>

                      <div className="d-grid">
                        <Button
                          type="submit"
                          className="btn btn-primary fw-semibold py-2"
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
                              Signing In...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </div>
                    </Form>

                    <p className="text-muted text-center mt-4 mb-0">
                      New here?{" "}
                      <Link
                        href="/auth-2/sign-up"
                        className="text-decoration-underline link-offset-3 fw-semibold"
                      >
                        Create an account
                      </Link>
                    </p>

                    <p className="text-center text-muted mt-4 mb-0">
                      © 2014 - {currentYear} INSPINIA — by{" "}
                      <span className="fw-semibold">{author}</span>
                    </p>
                  </div>
                </Col>
                <Col lg={6} className="d-none d-lg-block">
                  <div className="h-100 position-relative card-side-img rounded-end-4 rounded-end rounded-0 overflow-hidden">
                    <div className="p-4 card-img-overlay rounded-4 rounded-start-0 auth-overlay d-flex align-items-end justify-content-center"></div>
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

export default SignIn;
