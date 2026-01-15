import mongoose from 'mongoose';

const orderPaymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'El ID de la orden es requerido']
  },
  amount: {
    type: Number,
    required: [true, 'El monto del pago es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: [true, 'El método de pago es requerido']
  },
  cashRegisterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashRegister',
    required: false, // Solo requerida para pagos en efectivo
    default: null
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cs_user',
    required: [true, 'El usuario que registró el pago es requerido']
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isAdvance: {
    type: Boolean,
    default: false
  },
  // Campos para integración con Stripe
  stripePaymentIntentId: {
    type: String,
    trim: true,
    default: null,
    index: true // Índice para búsquedas rápidas
  },
  stripePaymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', null],
    default: null
  },
  stripePaymentMethod: {
    type: String,
    trim: true,
    default: null
  },
  stripeRefundId: {
    type: String,
    trim: true,
    default: null
  },
  stripeCustomerId: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para mejorar rendimiento
orderPaymentSchema.index({ orderId: 1 });
orderPaymentSchema.index({ date: -1 });
orderPaymentSchema.index({ cashRegisterId: 1 });

export default mongoose.model('OrderPayment', orderPaymentSchema);
