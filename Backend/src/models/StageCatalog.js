import mongoose from "mongoose";
const { Schema } = mongoose;

const stageCatalogSchema = new Schema(
  {
    administrator: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El administrador es requerido"],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      required: [true, "La empresa es requerida"],
    },
    name: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
    },
    abreviation: {
      type: String,
      required: [true, "La abreviación es requerida"],
      trim: true,
      uppercase: true,
    },
    stageNumber: {
      type: Number,
      required: [true, "El número de etapa es requerido"],
      min: [1, "El número de etapa debe ser mayor a 0"],
    },
    boardType: {
      type: String,
      required: [true, "El tipo de tablero es requerido"],
      enum: {
        values: ["Produccion", "Envio"],
        message: "{VALUE} no es un tipo de tablero válido",
      },
    },
    color: {
      r: {
        type: Number,
        required: [true, "El componente R del color es requerido"],
        min: 0,
        max: 255,
      },
      g: {
        type: Number,
        required: [true, "El componente G del color es requerido"],
        min: 0,
        max: 255,
      },
      b: {
        type: Number,
        required: [true, "El componente B del color es requerido"],
        min: 0,
        max: 255,
      },
      a: {
        type: Number,
        default: 1,
        min: 0,
        max: 1,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para actualizar updatedAt
stageCatalogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índice compuesto para garantizar que el nombre sea único por empresa y tipo de tablero
stageCatalogSchema.index({ company: 1, name: 1, boardType: 1 }, { unique: true });

// Índice compuesto para garantizar que el número de etapa sea único por empresa y tipo de tablero
stageCatalogSchema.index({ company: 1, stageNumber: 1, boardType: 1 }, { unique: true });

// Índices para búsquedas rápidas
stageCatalogSchema.index({ administrator: 1 });
stageCatalogSchema.index({ company: 1 });
stageCatalogSchema.index({ isActive: 1 });
stageCatalogSchema.index({ createdAt: -1 });

const StageCatalog = mongoose.model("cv_stage_catalog", stageCatalogSchema);
export { StageCatalog };
