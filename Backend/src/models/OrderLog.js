import mongoose from 'mongoose';

const orderLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'El ID de la orden es requerido'],
    index: true
  },
  eventType: {
    type: String,
    required: [true, 'El tipo de evento es requerido'],
    enum: [
      'order_created',
      'payment_received',
      'payment_deleted',
      'order_cancelled',
      'stage_changed',
      'status_changed',
      'sent_to_shipping',
      'order_completed',
      'discount_requested',
      'discount_approved',
      'discount_rejected',
      'discount_redeemed'
    ],
    index: true
  },
  description: {
    type: String,
    required: [true, 'La descripción del evento es requerida'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cs_user',
    required: [true, 'El ID del usuario es requerido']
  },
  userName: {
    type: String,
    required: [true, 'El nombre del usuario es requerido'],
    trim: true
  },
  userRole: {
    type: String,
    required: [true, 'El rol del usuario es requerido'],
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índice compuesto para consultas principales (ordenar por timestamp descendente)
orderLogSchema.index({ orderId: 1, timestamp: -1 });

// Índice para consultas por usuario (auditoría)
orderLogSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('OrderLog', orderLogSchema);
