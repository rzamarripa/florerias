import mongoose from "mongoose";

const { Schema } = mongoose;

const neighborhoodSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la colonia es requerido"],
      trim: true,
      unique: true,
    },
    priceDelivery: {
      type: Number,
      required: [true, "El precio de entrega es requerido"],
      min: [0, "El precio de entrega debe ser mayor o igual a 0"],
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
neighborhoodSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
neighborhoodSchema.index({ name: 1 });
neighborhoodSchema.index({ status: 1 });
neighborhoodSchema.index({ createdAt: -1 });

const Neighborhood = mongoose.model("cv_neighborhood", neighborhoodSchema);
export { Neighborhood };
