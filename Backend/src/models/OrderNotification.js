import mongoose from 'mongoose';

const orderNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cs_user',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  userRole: {
    type: String,
    required: true,
    trim: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_branch',
    required: true
  },
  orderNumber: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isCanceled: {
    type: Boolean,
    default: false
  },
  isDiscountAuth: {
    type: Boolean,
    default: false
  },
  discountAuthId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiscountAuth',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para mejorar rendimiento
orderNotificationSchema.index({ branchId: 1 });
orderNotificationSchema.index({ userId: 1 });
orderNotificationSchema.index({ isRead: 1 });
orderNotificationSchema.index({ createdAt: -1 });

const OrderNotification = mongoose.model('OrderNotification', orderNotificationSchema);

export default OrderNotification;
