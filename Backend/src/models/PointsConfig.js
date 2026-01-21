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
    // Indicador de configuración global (empresa) o específica (sucursal)
    isGlobal: {
      type: Boolean,
      required: true,
      default: false,
    },
    // Empresa asociada (para configuración global)
    company: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      default: null,
    },
    // Sucursal asociada (para configuración específica)
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      default: null,
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

// Validación personalizada para asegurar que tenga company O branch
pointsConfigSchema.pre('validate', function(next) {
  if (this.isGlobal) {
    // Si es global, debe tener company y no branch
    if (!this.company) {
      next(new Error('La empresa es requerida para configuración global'));
    } else if (this.branch) {
      next(new Error('Una configuración global no puede tener sucursal específica'));
    } else {
      next();
    }
  } else {
    // Si no es global, debe tener branch y no company
    if (!this.branch) {
      next(new Error('La sucursal es requerida para configuración específica'));
    } else if (this.company) {
      next(new Error('Una configuración específica no puede tener empresa'));
    } else {
      next();
    }
  }
});

// Index para búsqueda por sucursal y empresa
pointsConfigSchema.index({ branch: 1 });
pointsConfigSchema.index({ company: 1 });
pointsConfigSchema.index({ status: 1 });
pointsConfigSchema.index({ isGlobal: 1 });

// Index único compuesto para evitar duplicados
pointsConfigSchema.index({ company: 1, isGlobal: 1 }, { 
  unique: true,
  partialFilterExpression: { company: { $ne: null } }
});
pointsConfigSchema.index({ branch: 1, isGlobal: 1 }, { 
  unique: true,
  partialFilterExpression: { branch: { $ne: null } }
});

const PointsConfig = mongoose.model("points_config", pointsConfigSchema);
export { PointsConfig };
