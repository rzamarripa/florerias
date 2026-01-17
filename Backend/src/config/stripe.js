import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Stripe con la clave secreta (solo si está configurada)
let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: false,
  });
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY no configurada - funcionalidades de pago deshabilitadas');
}

// Configuración de moneda y otros parámetros
export const STRIPE_CONFIG = {
  currency: 'mxn', // Peso mexicano
  minimumChargeAmount: 1000, // $10.00 MXN en centavos (Stripe maneja en centavos)
  paymentMethodTypes: ['card'], // Tipos de pago aceptados
};

// Funciones helper para conversión de montos
export const convertToStripeAmount = (amount) => {
  // Convertir de pesos a centavos (multiplicar por 100)
  return Math.round(amount * 100);
};

export const convertFromStripeAmount = (amount) => {
  // Convertir de centavos a pesos (dividir por 100)
  return amount / 100;
};

// Helper para verificar si Stripe está configurado
const ensureStripeConfigured = () => {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en variables de entorno.');
  }
};

// Función para crear un Payment Intent
export const createPaymentIntent = async ({ amount, orderId, customerId, metadata = {} }) => {
  ensureStripeConfigured();
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: convertToStripeAmount(amount),
      currency: STRIPE_CONFIG.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId || '',
        customerId: customerId || '',
        ...metadata,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    throw error;
  }
};

// Función para confirmar un Payment Intent
export const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  ensureStripeConfigured();
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error confirmando Payment Intent:', error);
    throw error;
  }
};

// Función para recuperar un Payment Intent
export const retrievePaymentIntent = async (paymentIntentId) => {
  ensureStripeConfigured();
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error recuperando Payment Intent:', error);
    throw error;
  }
};

// Función para cancelar un Payment Intent
export const cancelPaymentIntent = async (paymentIntentId) => {
  ensureStripeConfigured();
  try {
    // Primero verificar el estado del Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Si ya fue exitoso, no intentar cancelar
    if (paymentIntent.status === 'succeeded') {
      console.log(`Payment Intent ${paymentIntentId} ya fue exitoso, no se puede cancelar`);
      return paymentIntent;
    }
    
    // Si el estado permite cancelación, proceder
    const cancelableStatuses = [
      'requires_payment_method',
      'requires_capture',
      'requires_reauthorization', 
      'requires_confirmation',
      'requires_action',
      'processing'
    ];
    
    if (cancelableStatuses.includes(paymentIntent.status)) {
      const canceledPaymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      return canceledPaymentIntent;
    }
    
    // Si el estado no permite cancelación, devolver el Payment Intent sin cambios
    console.log(`Payment Intent ${paymentIntentId} con estado ${paymentIntent.status} no puede ser cancelado`);
    return paymentIntent;
  } catch (error) {
    console.error('Error cancelando Payment Intent:', error);
    throw error;
  }
};

// Función para crear/obtener un cliente de Stripe
export const createOrGetStripeCustomer = async ({ email, name, phone, metadata = {} }) => {
  ensureStripeConfigured();
  try {
    // Buscar si el cliente ya existe por email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      // Si existe, devolver el cliente existente
      return existingCustomers.data[0];
    }

    // Si no existe, crear uno nuevo
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      phone: phone,
      metadata: metadata,
    });

    return customer;
  } catch (error) {
    console.error('Error creando/obteniendo cliente de Stripe:', error);
    throw error;
  }
};

// Función para procesar reembolsos
export const createRefund = async (paymentIntentId, amount = null) => {
  ensureStripeConfigured();
  try {
    const refundData = {
      payment_intent: paymentIntentId,
    };

    // Si se especifica un monto, hacer reembolso parcial
    if (amount !== null) {
      refundData.amount = convertToStripeAmount(amount);
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Error creando reembolso:', error);
    throw error;
  }
};

// Función para verificar el estado de un pago
export const verifyPaymentStatus = async (paymentIntentId) => {
  try {
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);
    
    return {
      isSuccessful: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      amount: convertFromStripeAmount(paymentIntent.amount),
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error('Error verificando estado del pago:', error);
    throw error;
  }
};

// Función para construir el webhook endpoint handler
export const constructWebhookEvent = (payload, signature, webhookSecret) => {
  ensureStripeConfigured();
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Error construyendo evento de webhook:', error);
    throw error;
  }
};

export default stripe;