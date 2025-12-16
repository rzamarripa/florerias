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
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
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

pointsRewardSchema.index({ branch: 1 });
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
