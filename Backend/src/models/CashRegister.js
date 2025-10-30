import mongoose from "mongoose";
const { Schema } = mongoose;

const cashRegisterSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la caja es requerido"],
      trim: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "cv_branch",
      required: [true, "La sucursal es requerida"],
    },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: false, // Campo temporal que se asigna al abrir la caja
      default: null,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El gerente es requerido"],
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: [0, "El saldo actual no puede ser negativo"],
    },
    initialBalance: {
      type: Number,
      default: 0,
      min: [0, "El saldo inicial no puede ser negativo"],
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    lastRegistry: [
      {
        orderId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
        },
        saleDate: {
          type: Date,
        },
      },
    ],
    expenses: [
      {
        expenseConcept: {
          type: String,
          required: [true, "El concepto del gasto es requerido"],
          trim: true,
        },
        amount: {
          type: Number,
          required: [true, "El monto del gasto es requerido"],
          min: [0, "El monto del gasto no puede ser negativo"],
        },
        expenseDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastOpen: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas rápidas
cashRegisterSchema.index({ branchId: 1 });
cashRegisterSchema.index({ cashierId: 1 });
cashRegisterSchema.index({ managerId: 1 });
cashRegisterSchema.index({ isOpen: 1 });
cashRegisterSchema.index({ isActive: 1 });

const CashRegister = mongoose.model("CashRegister", cashRegisterSchema);
export default CashRegister;
