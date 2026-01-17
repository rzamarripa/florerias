"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Lock, Check, AlertCircle, X, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

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
  hidePostalCode: true, // Ocultar codigo postal ya que no es comun en Mexico
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
          throw new Error("No se pudo crear la intencion de pago");
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
        // Silenciosamente ignorar errores de cancelacion
        cancelPaymentIntent(paymentIntentId).catch(() => {
          // Ignorar error silenciosamente - probablemente ya fue procesado
        });
      }
    };
  }, [paymentIntentId, succeeded, processing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError("El sistema de pago no esta listo. Por favor, espera un momento.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Error al obtener informacion de la tarjeta");
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

          toast.success("Pago procesado exitosamente!");
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
      // Silenciosamente ignorar errores de cancelacion
      cancelPaymentIntent(paymentIntentId).catch(() => {
        // Ignorar error silenciosamente - probablemente ya fue procesado
      });
    }
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle size={16} className="mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {succeeded ? (
        <Alert className="mb-3 bg-green-50 border-green-200">
          <Check size={20} className="mr-2 text-green-600" />
          <AlertDescription className="text-green-800">Pago procesado exitosamente!</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-3 space-y-2">
            <Label className="font-semibold">
              Nombre del titular de la tarjeta
            </Label>
            <Input
              type="text"
              placeholder="Como aparece en la tarjeta"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
              disabled={processing || !clientSecret}
            />
          </div>

          <div className="mb-3 space-y-2">
            <Label className="font-semibold">
              Informacion de la tarjeta
            </Label>
            <div
              className="border rounded-md p-3"
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
                <div className="text-center text-muted-foreground">
                  <Loader2 className="animate-spin inline-block mr-2" size={16} />
                  Preparando formulario de pago...
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center">
              <Lock size={12} className="mr-1" />
              Tu informacion esta protegida con encriptacion SSL
            </p>
          </div>

          {customerInfo?.clientId && (
            <div className="mb-3 flex items-center space-x-2">
              <Checkbox
                id="save-card"
                checked={saveCard}
                onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                disabled={processing || !clientSecret}
              />
              <Label htmlFor="save-card" className="text-sm cursor-pointer">
                Guardar tarjeta para futuras compras (proximamente)
              </Label>
            </div>
          )}

          <hr className="my-4" />

          <div className="flex justify-between items-center mb-4">
            <span className="text-lg">Total a pagar:</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatAmount(amount, "mxn")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleCancel}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!stripe || processing || !clientSecret || succeeded}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard size={20} className="mr-2" />
                  Pagar {formatAmount(amount, "mxn")}
                </>
              )}
            </Button>
          </div>

          <div className="text-center mt-3">
            <small className="text-muted-foreground">
              Procesado de forma segura por{" "}
              <strong className="text-blue-600">Stripe</strong>
            </small>
          </div>
        </>
      )}
    </form>
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
          throw new Error("No se pudo obtener la configuracion de Stripe");
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
    // Cerrar modal despues de un breve delay para mostrar el mensaje de exito
    setTimeout(() => {
      onHide();
    }, 2000);
  };

  const elementsOptions: StripeElementsOptions = {
    locale: "es",
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard size={24} />
            Pago con Tarjeta
          </DialogTitle>
          <Button
            variant="ghost"
            className="text-muted-foreground p-0 h-auto"
            onClick={onHide}
            aria-label="Cerrar"
          >
            <X size={24} />
          </Button>
        </DialogHeader>

        <div className="py-4">
          {loadingStripe ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
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
            <Alert variant="destructive">
              <AlertCircle size={16} className="mr-2" />
              <AlertDescription>
                No se pudo cargar el sistema de pago. Por favor, recarga la pagina e intenta nuevamente.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;
