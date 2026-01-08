"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  FormControl,
  FormLabel,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
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
      // Reset state when modal opens
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

    console.log("Enviando código a:", email);
    setIsLoading(true);
    setError("");

    try {
      const response = await sendResetCode(email);
      console.log("Respuesta del servidor:", response);
      
      if (response.success) {
        setSuccess("Código enviado exitosamente a tu correo");
        setStep("code");
        setResendTimer(60); // 60 seconds before allowing resend
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

    // Validations
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

    const response = await resetPassword(email, code, newPassword, confirmPassword);
    
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
            <Modal.Header closeButton>
              <Modal.Title>Recuperar Contraseña</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted mb-4">
                Ingresa tu correo electrónico y te enviaremos un código de verificación
              </p>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" className="mb-3">
                  {success}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <FormLabel>Correo Electrónico</FormLabel>
                <InputGroup>
                  <InputGroup.Text>
                    <TbMail />
                  </InputGroup.Text>
                  <FormControl
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSendCode}
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Código"
                )}
              </Button>
            </Modal.Footer>
          </>
        );

      case "code":
        return (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Verificar Código</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted mb-4">
                Ingresa el código de 6 dígitos que enviamos a {email}
              </p>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" className="mb-3">
                  {success}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <FormLabel>Código de Verificación</FormLabel>
                <InputGroup>
                  <InputGroup.Text>
                    <TbShieldLock />
                  </InputGroup.Text>
                  <FormControl
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    disabled={isLoading}
                    className="text-center fs-4 fw-bold"
                  />
                </InputGroup>
              </Form.Group>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-muted small">
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
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setStep("email")}>
                Volver
              </Button>
              <Button
                variant="primary"
                onClick={handleVerifyCode}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
            </Modal.Footer>
          </>
        );

      case "reset":
        return (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Nueva Contraseña</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted mb-4">
                Ingresa tu contraseña actual y crea una nueva contraseña
              </p>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" className="mb-3">
                  {success}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <FormLabel>Contraseña Actual</FormLabel>
                <InputGroup>
                  <InputGroup.Text>
                    <TbLock />
                  </InputGroup.Text>
                  <FormControl
                    type="password"
                    placeholder="Contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <FormLabel>Nueva Contraseña</FormLabel>
                <InputGroup>
                  <InputGroup.Text>
                    <TbLock />
                  </InputGroup.Text>
                  <FormControl
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Mínimo 3 caracteres
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                <InputGroup>
                  <InputGroup.Text>
                    <TbLock />
                  </InputGroup.Text>
                  <FormControl
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </InputGroup>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setStep("code")}>
                Volver
              </Button>
              <Button
                variant="primary"
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
                    <Spinner size="sm" className="me-2" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </Modal.Footer>
          </>
        );
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      {renderStepContent()}
    </Modal>
  );
};

export default PasswordResetModal;