import mongoose from "mongoose";
const { Schema } = mongoose;

const pointsRewardSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la recompensa es requerido"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
      default: "",
    },
    pointsRequired: {
      type: Number,
      required: [true, "Los puntos requeridos son obligatorios"],
      min: [1, "Los puntos requeridos deben ser al menos 1"],
    },
    rewardType: {
      type: String,
      required: true,
      enum: ["discount", "product", "service", "other"],
      default: "discount",
    },
    rewardValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // Indica si es una recompensa de producto
    isProducto: {
      type: Boolean,
      default: false,
    },
    // Producto asociado (cuando isProducto es true)
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    // Cantidad del producto a entregar como recompensa
    productQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    isPercentage: {
      type: Boolean,
      default: false,
    },
    maxRedemptionsPerClient: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRedemptions: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxTotalRedemptions: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    // Indica si es una recompensa global (empresa) o específica (sucursal)
    isGlobal: {
      type: Boolean,
      required: true,
      default: false,
    },
    // Empresa para recompensas globales (solo si isGlobal es true)
    company: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      default: null,
    },
    // Sucursal para recompensas específicas (solo si isGlobal es false)
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      default: null,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

// Validación personalizada: solo recompensas canjeables pueden ser globales
pointsRewardSchema.pre('save', function(next) {
  // Solo recompensas canjeables (isProducto: false) pueden ser globales
  if (this.isGlobal && this.isProducto) {
    return next(new Error('Los productos como recompensa no pueden ser globales, deben ser específicos de sucursal'));
  }
  
  // Validar que tenga company O branch según isGlobal
  if (this.isGlobal) {
    if (!this.company) {
      return next(new Error('Las recompensas globales requieren una empresa'));
    }
    // Las globales no deben tener branch
    this.branch = null;
  } else {
    if (!this.branch) {
      return next(new Error('Las recompensas específicas requieren una sucursal'));
    }
    // Las específicas no deben tener company
    this.company = null;
  }
  
  next();
});

// Indexes
pointsRewardSchema.index({ branch: 1 });
pointsRewardSchema.index({ company: 1 });
pointsRewardSchema.index({ isGlobal: 1 });
pointsRewardSchema.index({ status: 1 });
pointsRewardSchema.index({ pointsRequired: 1 });
pointsRewardSchema.index({ productId: 1 });
pointsRewardSchema.index({ rewardType: 1 });
pointsRewardSchema.index({ isProducto: 1 });

pointsRewardSchema.methods.canBeRedeemed = function () {
  const now = new Date();

  if (!this.status) return false;

  if (this.validFrom && now < this.validFrom) return false;

  if (this.validUntil && now > this.validUntil) return false;

  if (this.maxTotalRedemptions > 0 && this.totalRedemptions >= this.maxTotalRedemptions) {
    return false;
  }

  return true;
};

const PointsReward = mongoose.model("points_reward", pointsRewardSchema);
export { PointsReward };
