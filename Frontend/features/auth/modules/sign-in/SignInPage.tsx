"use client";

import AppLogo from "@/components/ui/AppLogo";
import { author, currentYear } from "@/helpers";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { TbLockPassword, TbMail } from "react-icons/tb";
import { AuthError, loginService } from "./services/auth";
import PasswordResetModal from "./components/PasswordResetModal";

const SignInPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const { setUser, setLoading } = useUserSessionStore();
  const { setAllowedModules } = useUserModulesStore();
  const { setUserRole } = useUserRoleStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

        const storedToken = useUserSessionStore.getState().token;
        console.debug(
          "Token almacenado en el store:",
          storedToken ? "Presente" : "Ausente"
        );

        const userRole = response.data.role;
        const roleLower = userRole?.toLowerCase();

        if (roleLower === "super admin" || roleLower === "superadmin") {
          router.push("/gestion/roles");
        } else if (userRole === "Cajero" || userRole === "Redes") {
          router.push("/sucursal/ventas");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(response.message || "Error en el inicio de sesión");
        setLoginAttempts((prev) => prev + 1);
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Error inesperado. Intenta nuevamente.");
      }
      setLoginAttempts((prev) => prev + 1);
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="rounded-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <AppLogo />
                <h4 className="font-bold mt-4 text-xl">Bienvenido a MaFlores</h4>
                <p className="text-muted-foreground lg:w-3/4 mx-auto">
                  Inicia sesión para acceder al panel de administración.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Label htmlFor="username">
                    Nombre de Usuario <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex mt-1">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                      <TbMail className="text-muted-foreground text-lg" />
                    </span>
                    <Input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Tu nombre de usuario"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="rounded-l-none"
                    />
                  </div>
                  {loginAttempts > 0 && (
                    <div className="text-right mt-2">
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-primary"
                        onClick={() => setShowPasswordReset(true)}
                      >
                        ¿Has olvidado tu contraseña? Recuperar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <Label htmlFor="password">
                    Contraseña <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex mt-1">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                      <TbLockPassword className="text-muted-foreground text-lg" />
                    </span>
                    <Input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-lg py-5 font-semibold"
                  disabled={
                    isSubmitting || !formData.username || !formData.password
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-6">
                © 2014 - {currentYear} MaFlores — by{" "}
                <span className="font-semibold">Masoft</span>
              </p>
            </CardContent>

            <div className="hidden lg:block bg-gradient-to-br from-primary/20 to-primary/5 min-h-[500px]" />
          </div>
        </Card>
      </div>

      <PasswordResetModal
        show={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
        userEmail={formData.username.includes("@") ? formData.username : ""}
      />
    </div>
  );
};

export default SignInPage;
