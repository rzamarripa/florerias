import { apiCall } from '@/utils/api';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Tipo para la configuración de Stripe
interface StripeConfig {
  publishableKey: string;
  currency: string;
  minimumAmount: number;
}

// Tipos para las respuestas del API
interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  stripeCustomerId?: string | null;
}

interface PaymentStatusResponse {
  isSuccessful: boolean;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  metadata: Record<string, any>;
}

interface RefundResponse {
  refundId: string;
  status: string;
  amount: number;
  message: string;
}

// Inicializar Stripe (singleton)
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Obtener instancia de Stripe
 */
export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    try {
      // Primero obtener la configuración del servidor
      const config = await getStripeConfig();
      if (config?.publishableKey) {
        stripePromise = loadStripe(config.publishableKey);
      } else {
        console.error('No se pudo obtener la clave pública de Stripe');
        return null;
      }
    } catch (error) {
      console.error('Error inicializando Stripe:', error);
      return null;
    }
  }
  return stripePromise;
};

/**
 * Obtener configuración de Stripe del servidor
 */
export const getStripeConfig = async (): Promise<StripeConfig | null> => {
  try {
    const response = await apiCall<StripeConfig>('/stripe/config', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo configuración de Stripe:', error);
    return null;
  }
};

/**
 * Crear una intención de pago
 */
export const createPaymentIntent = async (params: {
  amount: number;
  orderId?: string;
  customerInfo?: {
    clientId?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}): Promise<PaymentIntentResponse | null> => {
  try {
    const response = await apiCall<PaymentIntentResponse>('/stripe/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Error al crear intención de pago');
  } catch (error: any) {
    console.error('Error creando Payment Intent:', error);
    throw error;
  }
};

/**
 * Confirmar un pago
 */
export const confirmPayment = async (params: {
  paymentIntentId: string;
  orderId?: string;
  cashRegisterId?: string;
  paymentMethodId?: string;
}): Promise<any> => {
  try {
    const response = await apiCall<any>('/stripe/confirm-payment', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Error al confirmar pago');
  } catch (error: any) {
    console.error('Error confirmando pago:', error);
    throw error;
  }
};

/**
 * Obtener estado de un pago
 */
export const getPaymentStatus = async (paymentIntentId: string): Promise<PaymentStatusResponse | null> => {
  try {
    const response = await apiCall<PaymentStatusResponse>(`/stripe/payment-status/${paymentIntentId}`, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo estado del pago:', error);
    return null;
  }
};

/**
 * Cancelar una intención de pago
 */
export const cancelPaymentIntent = async (paymentIntentId: string): Promise<boolean> => {
  try {
    const response = await apiCall<any>(`/stripe/cancel/${paymentIntentId}`, {
      method: 'POST',
    });

    return response.success;
  } catch (error) {
    console.error('Error cancelando Payment Intent:', error);
    return false;
  }
};

/**
 * Procesar reembolso
 */
export const processRefund = async (params: {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}): Promise<RefundResponse | null> => {
  try {
    const response = await apiCall<RefundResponse>('/stripe/refund', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error procesando reembolso:', error);
    return null;
  }
};

/**
 * Validar si un método de pago es de tarjeta
 */
export const isCardPaymentMethod = (paymentMethodName: string): boolean => {
  const cardKeywords = ['tarjeta', 'card', 'credito', 'débito', 'debito', 'visa', 'mastercard', 'amex'];
  return cardKeywords.some(keyword => 
    paymentMethodName.toLowerCase().includes(keyword)
  );
};

/**
 * Formatear monto para mostrar
 */
export const formatAmount = (amount: number, currency: string = 'mxn'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

/**
 * Validar monto mínimo
 */
export const validateMinimumAmount = async (amount: number): Promise<{ valid: boolean; minimumAmount?: number }> => {
  try {
    const config = await getStripeConfig();
    if (!config) {
      return { valid: false };
    }

    return {
      valid: amount >= config.minimumAmount,
      minimumAmount: config.minimumAmount
    };
  } catch (error) {
    console.error('Error validando monto mínimo:', error);
    return { valid: false };
  }
};

export const stripeService = {
  getStripe,
  getStripeConfig,
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  cancelPaymentIntent,
  processRefund,
  isCardPaymentMethod,
  formatAmount,
  validateMinimumAmount
};