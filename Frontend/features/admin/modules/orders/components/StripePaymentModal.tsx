"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Alert, Spinner, Form, Row, Col } from "react-bootstrap";
import { CreditCard, Lock, Check, AlertCircle, X } from "lucide-react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  createPaymentIntent,
  confirmPayment,
  cancelPaymentIntent,
  getStripeConfig,
  formatAmount,
} from "@/services/stripeService";
import { toast } from "react-toastify";

// Estilos personalizados para el CardElement
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
  hidePostalCode: true, // Ocultar código postal ya que no es común en México
};

interface StripePaymentModalProps {
  show: boolean;
  onHide: () => void;
  amount: number;
  orderId?: string;
  customerInfo?: {
    clientId?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  branchId?: string;
  onPaymentSuccess: (paymentData: {
    paymentIntentId: string;
    paymentMethodId?: string;
    status: string;
  }) => void;
  onPaymentError: (error: string) => void;
}

// Componente interno que usa los hooks de Stripe
const PaymentForm: React.FC<{
  amount: number;
  orderId?: string;
  customerInfo?: any;
  branchId?: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  isTestMode?: boolean;
}> = ({ amount, orderId, customerInfo, branchId, onSuccess, onError, onCancel, isTestMode = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [cardholderName, setCardholderName] = useState(customerInfo?.name || "");
  const [saveCard, setSaveCard] = useState(false);

  // Crear Payment Intent al montar el componente
  useEffect(() => {
    const setupPaymentIntent = async () => {
      try {
        setError(null);
        const response = await createPaymentIntent({
          amount,
          orderId,
          customerInfo,
          metadata: { branchId: branchId || "" },
        });

        if (response) {
          setPaymentIntentId(response.paymentIntentId);
          setClientSecret(response.clientSecret);
          setStripeCustomerId(response.stripeCustomerId || null);
        } else {
          throw new Error("No se pudo crear la intención de pago");
        }
      } catch (err: any) {
        console.error("Error creando Payment Intent:", err);
        setError(err.message || "Error al preparar el pago");
        onError(err.message || "Error al preparar el pago");
      }
    };

    if (amount > 0) {
      setupPaymentIntent();
    }
  }, [amount, orderId, customerInfo, branchId]);

  // Limpiar Payment Intent si se cancela
  useEffect(() => {
    return () => {
      // Solo cancelar si el Payment Intent no fue exitoso
      // No intentar cancelar si succeeded = true
      if (paymentIntentId && !succeeded && !processing) {
        // Silenciosamente ignorar errores de cancelación
        cancelPaymentIntent(paymentIntentId).catch(() => {
          // Ignorar error silenciosamente - probablemente ya fue procesado
        });
      }
    };
  }, [paymentIntentId, succeeded, processing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError("El sistema de pago no está listo. Por favor, espera un momento.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Error al obtener información de la tarjeta");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirmar el pago con Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName || customerInfo?.name || "Cliente",
            email: customerInfo?.email,
            phone: customerInfo?.phone,
          },
        },
        setup_future_usage: saveCard ? "off_session" : undefined,
      });

      if (result.error) {
        // Error en el pago
        setError(result.error.message || "Error al procesar el pago");
        onError(result.error.message || "Error al procesar el pago");
      } else if (result.paymentIntent) {
        // Pago exitoso
        if (result.paymentIntent.status === "succeeded") {
          setSucceeded(true);
          
          // Notificar al backend sobre el pago exitoso
          if (paymentIntentId) {
            await confirmPayment({
              paymentIntentId,
              orderId,
              paymentMethodId: result.paymentIntent.payment_method as string,
            });
          }

          onSuccess({
            paymentIntentId: result.paymentIntent.id,
            paymentMethodId: result.paymentIntent.payment_method,
            status: result.paymentIntent.status,
            stripeCustomerId: stripeCustomerId,
          });

          toast.success("¡Pago procesado exitosamente!");
        } else {
          // Estado inesperado
          setError(`Estado del pago: ${result.paymentIntent.status}`);
          onError(`Estado del pago: ${result.paymentIntent.status}`);
        }
      }
    } catch (err: any) {
      console.error("Error procesando pago:", err);
      setError(err.message || "Error al procesar el pago");
      onError(err.message || "Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    // Solo cancelar si el Payment Intent no fue exitoso
    if (paymentIntentId && !succeeded && !processing) {
      // Silenciosamente ignorar errores de cancelación
      cancelPaymentIntent(paymentIntentId).catch(() => {
        // Ignorar error silenciosamente - probablemente ya fue procesado
      });
    }
    onCancel();
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" className="mb-3">
          <AlertCircle size={16} className="me-2" />
          {error}
        </Alert>
      )}

      {succeeded ? (
        <Alert variant="success" className="mb-3">
          <Check size={20} className="me-2" />
          ¡Pago procesado exitosamente!
        </Alert>
      ) : (
        <>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Nombre del titular de la tarjeta
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Como aparece en la tarjeta"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
              disabled={processing || !clientSecret}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Información de la tarjeta
            </Form.Label>
            <div
              className="form-control py-3"
              style={{
                backgroundColor: processing || !clientSecret ? "#f8f9fa" : "white",
              }}
            >
              {clientSecret ? (
                <CardElement
                  options={{
                    ...CARD_ELEMENT_OPTIONS,
                    disabled: processing,
                  }}
                />
              ) : (
                <div className="text-center text-muted">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Preparando formulario de pago...
                </div>
              )}
            </div>
            <Form.Text className="text-muted">
              <Lock size={12} className="me-1" />
              Tu información está protegida con encriptación SSL
            </Form.Text>
          </Form.Group>

          {customerInfo?.clientId && (
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="save-card"
                label="Guardar tarjeta para futuras compras (próximamente)"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                disabled={processing || !clientSecret}
              />
            </Form.Group>
          )}

          <hr className="my-4" />

          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="fs-5">Total a pagar:</span>
            <span className="fs-3 fw-bold text-primary">
              {formatAmount(amount, "mxn")}
            </span>
          </div>

          <Row className="g-2">
            <Col xs={6}>
              <Button
                variant="outline-secondary"
                size="lg"
                className="w-100"
                onClick={handleCancel}
                disabled={processing}
              >
                Cancelar
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-100"
                disabled={!stripe || processing || !clientSecret || succeeded}
              >
                {processing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} className="me-2" />
                    Pagar {formatAmount(amount, "mxn")}
                  </>
                )}
              </Button>
            </Col>
          </Row>

          <div className="text-center mt-3">
            <small className="text-muted">
              Procesado de forma segura por{" "}
              <strong className="text-primary">Stripe</strong>
            </small>
          </div>
        </>
      )}
    </Form>
  );
};

// Componente principal del modal
const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  show,
  onHide,
  amount,
  orderId,
  customerInfo,
  branchId,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loadingStripe, setLoadingStripe] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);

  // Cargar Stripe al montar el componente
  useEffect(() => {
    const loadStripeLib = async () => {
      try {
        const config = await getStripeConfig();
        if (config?.publishableKey) {
          // Detectar si estamos en modo de prueba
          const isTest = config.publishableKey.startsWith('pk_test_');
          setIsTestMode(isTest);
          const stripe = await loadStripe(config.publishableKey);
          setStripePromise(stripe);
        } else {
          throw new Error("No se pudo obtener la configuración de Stripe");
        }
      } catch (error: any) {
        console.error("Error cargando Stripe:", error);
        onPaymentError(error.message || "Error al cargar el sistema de pago");
      } finally {
        setLoadingStripe(false);
      }
    };

    if (show) {
      loadStripeLib();
    }
  }, [show]);

  const handlePaymentSuccess = (paymentData: any) => {
    onPaymentSuccess(paymentData);
    // Cerrar modal después de un breve delay para mostrar el mensaje de éxito
    setTimeout(() => {
      onHide();
    }, 2000);
  };

  const elementsOptions: StripeElementsOptions = {
    locale: "es",
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton={false}>
        <Modal.Title className="d-flex align-items-center gap-2">
          <CreditCard size={24} />
          Pago con Tarjeta
        </Modal.Title>
        <Button
          variant="link"
          className="text-muted ms-auto p-0"
          onClick={onHide}
          aria-label="Cerrar"
        >
          <X size={24} />
        </Button>
      </Modal.Header>
      <Modal.Body className="py-4">
        {loadingStripe ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando sistema de pago...</p>
          </div>
        ) : stripePromise ? (
          <Elements stripe={stripePromise} options={elementsOptions}>
            <PaymentForm
              amount={amount}
              orderId={orderId}
              customerInfo={customerInfo}
              branchId={branchId}
              onSuccess={handlePaymentSuccess}
              onError={onPaymentError}
              onCancel={onHide}
              isTestMode={isTestMode}
            />
          </Elements>
        ) : (
          <Alert variant="danger">
            <AlertCircle size={16} className="me-2" />
            No se pudo cargar el sistema de pago. Por favor, recarga la página e intenta nuevamente.
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default StripePaymentModal;