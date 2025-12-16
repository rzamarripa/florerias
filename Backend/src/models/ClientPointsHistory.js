import mongoose from "mongoose";
const { Schema } = mongoose;

const clientPointsHistorySchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: [true, "El cliente es requerido"],
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    points: {
      type: Number,
      required: [true, "Los puntos son requeridos"],
    },
    type: {
      type: String,
      required: true,
      enum: ["earned", "redeemed"],
      default: "earned",
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "purchase_amount", // Puntos por total de compra
        "accumulated_purchases", // Puntos por compras acumuladas
        "first_purchase", // Puntos por primera compra
        "client_registration", // Puntos por registro de cliente
        "branch_visit", // Puntos por visita a sucursal
        "redemption", // Canje de puntos por recompensa
        "manual_adjustment", // Ajuste manual
        "expiration", // Expiración de puntos
      ],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
    },
    balanceBefore: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      default: null,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

// Indexes
clientPointsHistorySchema.index({ clientId: 1 });
clientPointsHistorySchema.index({ orderId: 1 });
clientPointsHistorySchema.index({ branchId: 1 });
clientPointsHistorySchema.index({ type: 1 });
clientPointsHistorySchema.index({ reason: 1 });
clientPointsHistorySchema.index({ createdAt: -1 });

const ClientPointsHistory = mongoose.model("client_points_history", clientPointsHistorySchema);
export { ClientPointsHistory };
