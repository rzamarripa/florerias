import {
  createPaymentIntent,
  retrievePaymentIntent,
  cancelPaymentIntent,
  verifyPaymentStatus,
  createOrGetStripeCustomer,
  createRefund,
  STRIPE_CONFIG,
  convertToStripeAmount,
  convertFromStripeAmount
} from '../config/stripe.js';
import OrderPayment from '../models/OrderPayment.js';
import Order from '../models/Order.js';
import { Branch } from '../models/Branch.js';
import { Company } from '../models/Company.js';

// Crear una intención de pago (Payment Intent)
const createStripePaymentIntent = async (req, res) => {
  try {
    const {
      amount,
      orderId,
      customerInfo,
      metadata = {}
    } = req.body;

    // Validar campos requeridos
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto es requerido y debe ser mayor a 0'
      });
    }

    // Validar monto mínimo
    const stripeAmount = convertToStripeAmount(amount);
    if (stripeAmount < STRIPE_CONFIG.minimumChargeAmount) {
      return res.status(400).json({
        success: false,
        message: `El monto mínimo es $${convertFromStripeAmount(STRIPE_CONFIG.minimumChargeAmount)} MXN`
      });
    }

    // Crear o obtener cliente de Stripe si se proporciona información
    let stripeCustomer = null;
    if (customerInfo && customerInfo.email) {
      try {
        stripeCustomer = await createOrGetStripeCustomer({
          email: customerInfo.email,
          name: customerInfo.name,
          phone: customerInfo.phone,
          metadata: {
            clientId: customerInfo.clientId || '',
            orderId: orderId || ''
          }
        });
      } catch (customerError) {
        console.error('Error creando/obteniendo cliente de Stripe:', customerError);
        // Continuar sin cliente si hay error
      }
    }

    // Crear Payment Intent
    const paymentIntent = await createPaymentIntent({
      amount,
      orderId,
      customerId: stripeCustomer?.id,
      metadata: {
        ...metadata,
        userId: req.user?._id?.toString() || '',
        branchId: metadata.branchId || ''
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: convertFromStripeAmount(paymentIntent.amount),
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        stripeCustomerId: stripeCustomer?.id || null
      }
    });
  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la intención de pago',
      error: error.message
    });
  }
};

// Confirmar un pago
const confirmStripePayment = async (req, res) => {
  try {
    const {
      paymentIntentId,
      orderId,
      cashRegisterId,
      paymentMethodId
    } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la intención de pago es requerido'
      });
    }

    // Verificar el estado actual del Payment Intent
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    // Si ya está confirmado, no hacer nada
    if (paymentIntent.status === 'succeeded') {
      // Buscar si ya existe un registro de pago
      const existingPayment = await OrderPayment.findOne({
        stripePaymentIntentId: paymentIntentId
      });

      if (existingPayment) {
        return res.status(200).json({
          success: true,
          data: {
            paymentId: existingPayment._id,
            status: 'succeeded',
            message: 'El pago ya fue procesado exitosamente'
          }
        });
      }

      // Si no existe registro pero el pago fue exitoso, crear uno
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          const orderPayment = new OrderPayment({
            orderId: order._id,
            amount: convertFromStripeAmount(paymentIntent.amount),
            paymentMethod: paymentMethodId || order.paymentMethod,
            cashRegisterId: cashRegisterId || null,
            date: new Date(),
            registeredBy: req.user?._id || null,
            notes: 'Pago con tarjeta procesado por Stripe',
            isAdvance: false,
            stripePaymentIntentId: paymentIntentId,
            stripePaymentStatus: 'succeeded',
            stripePaymentMethod: paymentIntent.payment_method
          });

          const savedPayment = await orderPayment.save();
          
          // Agregar el pago a la orden
          order.payments.push(savedPayment._id);
          
          // Actualizar el saldo restante
          order.remainingBalance = Math.max(0, order.remainingBalance - convertFromStripeAmount(paymentIntent.amount));
          
          await order.save();

          return res.status(200).json({
            success: true,
            data: {
              paymentId: savedPayment._id,
              status: 'succeeded',
              message: 'Pago registrado exitosamente'
            }
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          status: 'succeeded',
          message: 'El pago fue procesado exitosamente'
        }
      });
    }

    // Si el pago requiere confirmación
    if (paymentIntent.status === 'requires_confirmation' || paymentIntent.status === 'requires_payment_method') {
      // El frontend debe manejar la confirmación con Stripe Elements
      return res.status(200).json({
        success: true,
        data: {
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret,
          message: 'Se requiere confirmación del pago en el cliente'
        }
      });
    }

    // Si el pago está en proceso
    if (paymentIntent.status === 'processing') {
      return res.status(200).json({
        success: true,
        data: {
          status: 'processing',
          message: 'El pago está siendo procesado'
        }
      });
    }

    // Si el pago falló
    if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') {
      return res.status(400).json({
        success: false,
        message: 'El pago no pudo ser procesado',
        error: paymentIntent.last_payment_error?.message || 'Error en el procesamiento del pago'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: paymentIntent.status,
        message: 'Estado del pago actualizado'
      }
    });
  } catch (error) {
    console.error('Error confirmando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar el pago',
      error: error.message
    });
  }
};

// Obtener el estado de un pago
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la intención de pago es requerido'
      });
    }

    const paymentStatus = await verifyPaymentStatus(paymentIntentId);

    res.status(200).json({
      success: true,
      data: paymentStatus
    });
  } catch (error) {
    console.error('Error obteniendo estado del pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el estado del pago',
      error: error.message
    });
  }
};

// Cancelar una intención de pago
const cancelStripePaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la intención de pago es requerido'
      });
    }

    const canceledPaymentIntent = await cancelPaymentIntent(paymentIntentId);

    res.status(200).json({
      success: true,
      data: {
        status: canceledPaymentIntent.status,
        message: 'Intención de pago cancelada exitosamente'
      }
    });
  } catch (error) {
    console.error('Error cancelando Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la intención de pago',
      error: error.message
    });
  }
};

// Procesar un reembolso
const processRefund = async (req, res) => {
  try {
    const {
      paymentIntentId,
      amount,
      reason
    } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la intención de pago es requerido'
      });
    }

    // Verificar que el pago existe y fue exitoso
    const paymentStatus = await verifyPaymentStatus(paymentIntentId);
    
    if (!paymentStatus.isSuccessful) {
      return res.status(400).json({
        success: false,
        message: 'No se puede reembolsar un pago que no fue exitoso'
      });
    }

    // Crear el reembolso
    const refund = await createRefund(paymentIntentId, amount);

    // Actualizar el registro en OrderPayment si existe
    const orderPayment = await OrderPayment.findOne({
      stripePaymentIntentId: paymentIntentId
    });

    if (orderPayment) {
      // Agregar nota sobre el reembolso
      orderPayment.notes = `${orderPayment.notes || ''}\n[REEMBOLSO] ${reason || 'Sin motivo especificado'} - Monto: $${amount || 'Total'}`;
      orderPayment.stripePaymentStatus = 'refunded';
      await orderPayment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        refundId: refund.id,
        status: refund.status,
        amount: convertFromStripeAmount(refund.amount),
        message: 'Reembolso procesado exitosamente'
      }
    });
  } catch (error) {
    console.error('Error procesando reembolso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el reembolso',
      error: error.message
    });
  }
};

// Webhook para recibir eventos de Stripe
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.log('⚠️ Webhook secret no configurado, saltando validación');
    // En desarrollo, podrías querer continuar sin validación
    // En producción, siempre debes validar
  }

  let event;

  try {
    if (webhookSecret && sig) {
      // Validar el webhook si tenemos el secret
      const { constructWebhookEvent } = await import('../config/stripe.js');
      event = constructWebhookEvent(req.rawBody || req.body, sig, webhookSecret);
    } else {
      // Sin validación (solo para desarrollo)
      event = req.body;
    }
  } catch (err) {
    console.error('Error validando webhook:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar diferentes tipos de eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Pago exitoso:', paymentIntent.id);
      
      // Actualizar OrderPayment si existe
      try {
        const orderPayment = await OrderPayment.findOne({
          stripePaymentIntentId: paymentIntent.id
        });

        if (orderPayment) {
          orderPayment.stripePaymentStatus = 'succeeded';
          await orderPayment.save();
        }

        // También podrías actualizar la orden si es necesario
        if (paymentIntent.metadata?.orderId) {
          const order = await Order.findById(paymentIntent.metadata.orderId);
          if (order && order.remainingBalance > 0) {
            const paymentAmount = convertFromStripeAmount(paymentIntent.amount);
            order.remainingBalance = Math.max(0, order.remainingBalance - paymentAmount);
            
            // Si ya no hay saldo pendiente, marcar como pagado
            if (order.remainingBalance === 0) {
              order.status = 'en-proceso'; // O el estado que corresponda
            }
            
            await order.save();
          }
        }
      } catch (updateError) {
        console.error('Error actualizando registros después del pago:', updateError);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Pago fallido:', failedPayment.id);
      
      // Actualizar OrderPayment si existe
      try {
        const orderPayment = await OrderPayment.findOne({
          stripePaymentIntentId: failedPayment.id
        });

        if (orderPayment) {
          orderPayment.stripePaymentStatus = 'failed';
          orderPayment.notes = `${orderPayment.notes || ''}\n[ERROR] ${failedPayment.last_payment_error?.message || 'Pago fallido'}`;
          await orderPayment.save();
        }
      } catch (updateError) {
        console.error('Error actualizando registro después del fallo:', updateError);
      }
      break;

    case 'charge.refunded':
      const refundedCharge = event.data.object;
      console.log('💰 Reembolso procesado:', refundedCharge.id);
      break;

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  // Retornar una respuesta 200 para confirmar recepción
  res.status(200).json({ received: true });
};

// Obtener la clave pública de Stripe (para el frontend)
const getPublishableKey = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        currency: STRIPE_CONFIG.currency,
        minimumAmount: convertFromStripeAmount(STRIPE_CONFIG.minimumChargeAmount)
      }
    });
  } catch (error) {
    console.error('Error obteniendo clave pública:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de Stripe',
      error: error.message
    });
  }
};

export {
  createStripePaymentIntent,
  confirmStripePayment,
  getPaymentStatus,
  cancelStripePaymentIntent,
  processRefund,
  handleStripeWebhook,
  getPublishableKey
};