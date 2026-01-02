import mongoose from "mongoose";
const { Schema } = mongoose;

const pointsConfigSchema = new Schema(
  {
    // Puntos por total de compra (ej: 1 punto por cada $100)
    pointsPerPurchaseAmount: {
      enabled: {
        type: Boolean,
        default: true,
      },
      amount: {
        type: Number,
        required: true,
        default: 100,
        min: 1,
      },
      points: {
        type: Number,
        required: true,
        default: 1,
        min: 0,
      },
    },
    // Puntos por cantidad de compras acumuladas
    pointsPerAccumulatedPurchases: {
      enabled: {
        type: Boolean,
        default: false,
      },
      purchasesRequired: {
        type: Number,
        required: true,
        default: 5,
        min: 1,
      },
      points: {
        type: Number,
        required: true,
        default: 10,
        min: 0,
      },
    },
    // Puntos por primera venta
    pointsForFirstPurchase: {
      enabled: {
        type: Boolean,
        default: true,
      },
      points: {
        type: Number,
        required: true,
        default: 5,
        min: 0,
      },
    },
    // Puntos por registro de cliente
    pointsForClientRegistration: {
      enabled: {
        type: Boolean,
        default: true,
      },
      points: {
        type: Number,
        required: true,
        default: 10,
        min: 0,
      },
    },
    // Puntos por visita a sucursal
    pointsForBranchVisit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      points: {
        type: Number,
        required: true,
        default: 2,
        min: 0,
      },
      maxVisitsPerDay: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
      },
    },
    // Sucursal asociada
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
      unique: true,
    },
    // Estado de la configuración
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

// Index para búsqueda por sucursal
pointsConfigSchema.index({ branch: 1 });
pointsConfigSchema.index({ status: 1 });

const PointsConfig = mongoose.model("points_config", pointsConfigSchema);
export { PointsConfig };
