import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'El ID de la orden es requerido'],
    index: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_branch',
    required: [true, 'El ID de la sucursal es requerido'],
    index: true
  },
  url: {
    type: String,
    required: [true, 'La URL del ticket es requerida'],
    trim: true
  },
  path: {
    type: String,
    required: [true, 'El path del ticket es requerido'],
    trim: true
  },
  isStoreTicket: {
    type: Boolean,
    required: true,
    default: true // true = ticket de venta en tienda, false = ticket de envío
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índice compuesto para buscar tickets de una orden
ticketSchema.index({ orderId: 1, isStoreTicket: 1 });

// Método para obtener todos los tickets de una orden
ticketSchema.statics.findByOrderId = function(orderId) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

// Método para obtener ticket de venta de una orden
ticketSchema.statics.findStoreTicket = function(orderId) {
  return this.findOne({ orderId, isStoreTicket: true });
};

// Método para obtener ticket de envío de una orden
ticketSchema.statics.findDeliveryTicket = function(orderId) {
  return this.findOne({ orderId, isStoreTicket: false });
};

export default mongoose.model('Ticket', ticketSchema);