import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del método de pago es requerido'],
    unique: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  abbreviation: {
    type: String,
    required: [true, 'La abreviatura es requerida'],
    trim: true,
    maxlength: [10, 'La abreviatura no puede exceder 10 caracteres']
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para mejorar rendimiento
paymentMethodSchema.index({ status: 1 });
paymentMethodSchema.index({ name: 1 });

export default mongoose.model('PaymentMethod', paymentMethodSchema);
