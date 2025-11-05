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
    required: [true, 'La caja registradora es requerida']
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
