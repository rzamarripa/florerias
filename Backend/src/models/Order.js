import mongoose from 'mongoose';

const clientInfoSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'client',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  clientInfo: {
    type: clientInfoSchema,
    required: true
  },
  salesChannel: {
    type: String,
    required: true,
    enum: ['tienda', 'whatsapp', 'facebook'],
    default: 'tienda'
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Debe haber al menos un producto en la orden'
    }
  },
  shippingType: {
    type: String,
    required: true,
    enum: ['envio', 'tienda', 'anonimo', 'venta-rapida'],
    default: 'tienda'
  },
  recipientName: {
    type: String,
    trim: true
  },
  deliveryDateTime: {
    type: Date
  },
  message: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: [
      'efectivo',
      'deposito',
      'transferencia',
      'oxxo',
      'tarjeta-debito',
      'tarjeta-credito',
      'amex',
      'cheque',
      'inter',
      'credito'
    ],
    default: 'efectivo'
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['porcentaje', 'cantidad'],
    default: 'porcentaje'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  advance: {
    type: Number,
    default: 0,
    min: 0
  },
  paidWith: {
    type: Number,
    default: 0,
    min: 0
  },
  change: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  sendToProduction: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pendiente', 'en-proceso', 'completado', 'cancelado'],
    default: 'pendiente'
  },
  orderNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para mejorar rendimiento
orderSchema.index({ 'clientInfo.name': 1 });
orderSchema.index({ 'clientInfo.phone': 1 });
orderSchema.index({ salesChannel: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// Middleware para generar número de orden antes de guardar
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const orderNum = String(count + 1).padStart(6, '0');
    this.orderNumber = `ORD-${orderNum}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
