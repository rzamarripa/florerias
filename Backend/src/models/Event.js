import mongoose from "mongoose";
import { Counter } from "./Counter.js";

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    folio: {
      type: Number,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "client",
      required: [true, "El cliente es requerido"],
    },
    eventDate: {
      type: Date,
      required: [true, "La fecha del evento es requerida"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
      required: [true, "El estatus de pago es requerido"],
    },
    orderDate: {
      type: Date,
      default: Date.now,
      required: [true, "La fecha de pedido es requerida"],
    },
    totalAmount: {
      type: Number,
      required: [true, "El total a pagar es requerido"],
      min: [0, "El total debe ser mayor o igual a 0"],
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, "El total pagado debe ser mayor o igual a 0"],
    },
    balance: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El usuario es requerido"],
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
eventSchema.pre("validate", async function (next) {
  if (this.isNew && !this.folio) {
    try {
      const counterId = `event_${this.branch}`;
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

// Middleware para calcular el saldo antes de guardar
eventSchema.pre("save", function (next) {
  // Calcular saldo (Total a pagar - Total pagado)
  this.balance = this.totalAmount - this.totalPaid;

  // Actualizar estatus de pago basado en el saldo
  if (this.totalPaid === 0) {
    this.paymentStatus = "pending";
  } else if (this.totalPaid >= this.totalAmount) {
    this.paymentStatus = "paid";
    this.totalPaid = this.totalAmount; // Asegurar que no se pague más del total
    this.balance = 0;
  } else {
    this.paymentStatus = "partial";
  }

  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
eventSchema.index({ branch: 1, folio: 1 }, { unique: true });
eventSchema.index({ user: 1 });
eventSchema.index({ client: 1 });
eventSchema.index({ paymentStatus: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ createdAt: -1 });

const Event = mongoose.model("cv_event", eventSchema);
export { Event };
