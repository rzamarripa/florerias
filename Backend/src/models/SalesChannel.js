import mongoose from "mongoose";

const { Schema } = mongoose;

const salesChannelSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del canal de ventas es requerido"],
      trim: true,
    },
    abbreviation: {
      type: String,
      required: [true, "La abreviatura es requerida"],
      trim: true,
      uppercase: true,
      maxlength: [10, "La abreviatura no puede tener más de 10 caracteres"],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "cv_company",
      required: [true, "La empresa es requerida"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: [true, "El estatus es requerido"],
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
salesChannelSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas y unicidad
salesChannelSchema.index({ name: 1, companyId: 1 }, { unique: true }); // Único por empresa
salesChannelSchema.index({ abbreviation: 1, companyId: 1 }, { unique: true }); // Abreviatura única por empresa
salesChannelSchema.index({ companyId: 1 });
salesChannelSchema.index({ status: 1 });
salesChannelSchema.index({ createdAt: -1 });

const SalesChannel = mongoose.model("cv_sales_channel", salesChannelSchema);
export { SalesChannel };