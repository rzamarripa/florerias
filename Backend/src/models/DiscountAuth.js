import mongoose from 'mongoose';

const discountAuthSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cs_user',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cs_user',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cv_branch',
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['porcentaje', 'cantidad'],
    default: 'porcentaje'
  },
  isAuth: {
    type: Boolean,
    default: null // null = pendiente, true = aprobado, false = rechazado
  },
  authFolio: {
    type: String,
    default: null,
    trim: true
  },
  isRedeemed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para mejorar rendimiento
discountAuthSchema.index({ branchId: 1 });
discountAuthSchema.index({ managerId: 1 });
discountAuthSchema.index({ requestedBy: 1 });
discountAuthSchema.index({ isAuth: 1 });
discountAuthSchema.index({ createdAt: -1 });
// Índice normal para authFolio - la unicidad se valida en el controlador
discountAuthSchema.index({ authFolio: 1 });

const DiscountAuth = mongoose.model('DiscountAuth', discountAuthSchema);

export default DiscountAuth;
