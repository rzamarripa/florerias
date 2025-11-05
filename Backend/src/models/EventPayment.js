import mongoose from 'mongoose';

const eventPaymentSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_event',
    required: [true, 'El ID del evento es requerido']
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
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cs_user',
    required: [true, 'El usuario que registró el pago es requerido']
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_branch',
    required: [true, 'La sucursal es requerida']
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
eventPaymentSchema.index({ event: 1 });
eventPaymentSchema.index({ paymentDate: -1 });
eventPaymentSchema.index({ branch: 1 });
eventPaymentSchema.index({ user: 1 });

const EventPayment = mongoose.model('cv_event_payment', eventPaymentSchema);
export { EventPayment };
