import express from 'express';
import {
  createStripePaymentIntent,
  confirmStripePayment,
  getPaymentStatus,
  cancelStripePaymentIntent,
  processRefund,
  handleStripeWebhook,
  getPublishableKey
} from '../controllers/stripeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Ruta pública para obtener la configuración de Stripe (clave pública)
router.get('/config', getPublishableKey);

// Webhook de Stripe (debe estar antes de protect ya que Stripe no envía tokens)
// IMPORTANTE: Esta ruta necesita el body crudo para validar la firma
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Rutas protegidas que requieren autenticación

// Crear una intención de pago
router.post(
  '/create-payment-intent',
  protect,
  authorize(['Administrador', 'Gerente', 'Cajero', 'Redes']),
  createStripePaymentIntent
);

// Confirmar un pago
router.post(
  '/confirm-payment',
  protect,
  authorize(['Administrador', 'Gerente', 'Cajero', 'Redes']),
  confirmStripePayment
);

// Obtener el estado de un pago
router.get(
  '/payment-status/:paymentIntentId',
  protect,
  authorize(['Administrador', 'Gerente', 'Cajero', 'Redes']),
  getPaymentStatus
);

// Cancelar una intención de pago
router.post(
  '/cancel/:paymentIntentId',
  protect,
  authorize(['Administrador', 'Gerente', 'Cajero', 'Redes']),
  cancelStripePaymentIntent
);

// Procesar un reembolso (solo administradores y gerentes)
router.post(
  '/refund',
  protect,
  authorize(['Administrador', 'Gerente']),
  processRefund
);

export default router;