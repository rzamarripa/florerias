import mongoose from "mongoose";
import { Counter } from "./Counter.js";

const { Schema } = mongoose;

const buySchema = new Schema(
  {
    paymentDate: {
      type: Date,
      required: [true, "La fecha de pago es requerida"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El usuario es requerido"],
    },
    folio: {
      type: Number,
    },
    concept: {
      type: String,
      required: [true, "El concepto es requerido"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "El importe es requerido"],
      min: [0, "El importe debe ser mayor o igual a 0"],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: [true, "La forma de pago es requerida"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
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

// Middleware para generar folio consecutivo por sucursal antes de validar
buySchema.pre("validate", async function (next) {
  if (this.isNew && !this.folio) {
    try {
      const counterId = `buy_${this.branch}`;
      const counter = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.folio = counter.seq;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Middleware para actualizar updatedAt
buySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
buySchema.index({ branch: 1, folio: 1 }, { unique: true });
buySchema.index({ user: 1 });
buySchema.index({ paymentMethod: 1 });
buySchema.index({ paymentDate: 1 });
buySchema.index({ createdAt: -1 });

const Buy = mongoose.model("cv_buy", buySchema);
export { Buy };
