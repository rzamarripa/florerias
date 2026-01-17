"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { TbMail, TbLock, TbShieldLock } from "react-icons/tb";
import {
  sendResetCode,
  verifyResetCode,
  resetPassword,
} from "../services/passwordReset";

interface PasswordResetModalProps {
  show: boolean;
  onClose: () => void;
  userEmail?: string;
}

type ModalStep = "email" | "code" | "reset";

const PasswordResetModal = ({
  show,
  onClose,
  userEmail = "",
}: PasswordResetModalProps) => {
  const [step, setStep] = useState<ModalStep>("email");
  const [email, setEmail] = useState(userEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (show) {
      setStep("email");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setError("");
      setSuccess("");
      setResendTimer(0);
    }
  }, [show]);

  const handleSendCode = async () => {
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await sendResetCode(email);

      if (response.success) {
        setSuccess("Código enviado exitosamente a tu correo");
        setStep("code");
        setResendTimer(60);
      } else {
        setError(response.message || "Error al enviar el código");
      }
    } catch (error) {
      console.error("Error al enviar código:", error);
      setError("Error de conexión. Por favor intenta de nuevo.");
    }

    setIsLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Por favor ingresa un código válido de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setError("");

    const response = await verifyResetCode(email, code);

    if (response.success) {
      setSuccess("Código verificado correctamente");
      setStep("reset");
    } else {
      setError(response.message || "Código inválido");
    }

    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    setError("");

    if (!currentPassword) {
      setError("Por favor ingresa tu contraseña actual");
      return;
    }

    if (!newPassword || newPassword.length < 3) {
      setError("La nueva contraseña debe tener al menos 3 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setIsLoading(true);

    const response = await resetPassword(
      email,
      code,
      newPassword,
      confirmPassword
    );

    if (response.success) {
      setSuccess("Contraseña actualizada exitosamente");
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError(response.message || "Error al actualizar la contraseña");
    }

    setIsLoading(false);
  };

  const handleResendCode = () => {
    setResendTimer(60);
    handleSendCode();
  };

  const renderStepContent = () => {
    switch (step) {
      case "email":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Recuperar Contraseña</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                Ingresa tu correo electrónico y te enviaremos un código de
                verificación
              </p>

              {error && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-3 border-green-500 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                    <TbMail className="text-muted-foreground" />
                  </span>
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSendCode} disabled={isLoading || !email}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Código"
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case "code":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Verificar Código</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                Ingresa el código de 6 dígitos que enviamos a {email}
              </p>

              {error && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-3 border-green-500 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Código de Verificación</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                    <TbShieldLock className="text-muted-foreground" />
                  </span>
                  <Input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    disabled={isLoading}
                    className="rounded-l-none text-center text-xl font-bold"
                  />
                </div>
              </div>

              <div className="text-center mt-4">
                {resendTimer > 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Reenviar código en {resendTimer} segundos
                  </p>
                ) : (
                  <Button
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    ¿No recibiste el código? Reenviar
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("email")}>
                Volver
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case "reset":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Nueva Contraseña</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground mb-4">
                Ingresa tu contraseña actual y crea una nueva contraseña
              </p>

              {error && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-3 border-green-500 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Contraseña Actual</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                      <TbLock className="text-muted-foreground" />
                    </span>
                    <Input
                      type="password"
                      placeholder="Contraseña actual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nueva Contraseña</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                      <TbLock className="text-muted-foreground" />
                    </span>
                    <Input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 3 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Confirmar Nueva Contraseña</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                      <TbLock className="text-muted-foreground" />
                    </span>
                    <Input
                      type="password"
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("code")}>
                Volver
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={
                  isLoading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>{renderStepContent()}</DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;
