import mongoose from "mongoose";
import { Counter } from "./Counter.js";

const { Schema } = mongoose;

const expenseSchema = new Schema(
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
      type: Schema.Types.ObjectId,
      ref: "cv_expense_concept",
      required: [true, "El concepto es requerido"],
    },
    total: {
      type: Number,
      required: [true, "El total es requerido"],
      min: [0, "El total debe ser mayor o igual a 0"],
    },
    expenseType: {
      type: String,
      enum: ["check_transfer", "petty_cash"],
      required: [true, "El tipo de gasto es requerido"],
    },
    cashRegister: {
      type: Schema.Types.ObjectId,
      ref: "CashRegister",
      required: function () {
        return this.expenseType === "petty_cash";
      },
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
expenseSchema.pre("validate", async function (next) {
  if (this.isNew && !this.folio) {
    try {
      const counterId = `expense_${this.branch}`;
      // Usar findOneAndUpdate sin sesión para MongoDB standalone
      const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          session: null // Deshabilitar sesiones explícitamente
        }
      );
      this.folio = counter.seq;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Middleware para actualizar updatedAt
expenseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas rápidas
expenseSchema.index({ branch: 1, folio: 1 }, { unique: true });
expenseSchema.index({ user: 1 });
expenseSchema.index({ expenseType: 1 });
expenseSchema.index({ paymentDate: 1 });
expenseSchema.index({ cashRegister: 1 });
expenseSchema.index({ createdAt: -1 });

const Expense = mongoose.model("cv_expense", expenseSchema);
export { Expense };
