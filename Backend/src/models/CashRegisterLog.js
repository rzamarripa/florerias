import mongoose from "mongoose";

const { Schema } = mongoose;

const cashRegisterLogSchema = new Schema(
  {
    cashRegisterId: {
      type: Schema.Types.ObjectId,
      ref: "CashRegister",
      required: [true, "La referencia a la caja registradora es requerida"],
    },
    cashRegisterName: {
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
      default: null,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "cs_user",
      required: [true, "El gerente es requerido"],
    },
    openedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: Date.now,
    },
    totals: {
      initialBalance: {
        type: Number,
        default: 0,
      },
      totalSales: {
        type: Number,
        default: 0,
      },
      totalExpenses: {
        type: Number,
        default: 0,
      },
      finalBalance: {
        type: Number,
        default: 0,
      },
      remainingBalance: {
        type: Number,
        default: 0,
      },
    },
    salesByPaymentType: {
      efectivo: {
        type: Number,
        default: 0,
      },
      credito: {
        type: Number,
        default: 0,
      },
      transferencia: {
        type: Number,
        default: 0,
      },
      intercambio: {
        type: Number,
        default: 0,
      },
    },
    orders: [
      {
        orderId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
        },
        orderNumber: {
          type: String,
        },
        clientName: {
          type: String,
        },
        recipientName: {
          type: String,
        },
        total: {
          type: Number,
          default: 0,
        },
        advance: {
          type: Number,
          default: 0,
        },
        shippingType: {
          type: String,
        },
        paymentMethod: {
          type: String,
        },
        status: {
          type: String,
        },
        saleDate: {
          type: Date,
        },
        itemsCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    expenses: [
      {
        expenseConcept: {
          type: String,
          trim: true,
        },
        amount: {
          type: Number,
          default: 0,
        },
        expenseDate: {
          type: Date,
        },
      },
    ],
    buys: [
      {
        buyId: {
          type: Schema.Types.ObjectId,
          ref: "cv_buy",
        },
        folio: {
          type: Number,
        },
        concept: {
          type: String,
        },
        conceptDescription: {
          type: String,
        },
        amount: {
          type: Number,
          default: 0,
        },
        paymentDate: {
          type: Date,
        },
        paymentMethod: {
          type: String,
        },
        provider: {
          type: String,
        },
        user: {
          type: String,
        },
        description: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar las consultas
cashRegisterLogSchema.index({ cashRegisterId: 1, closedAt: -1 });
cashRegisterLogSchema.index({ branchId: 1, closedAt: -1 });
cashRegisterLogSchema.index({ closedAt: -1 });

const CashRegisterLog = mongoose.model("CashRegisterLog", cashRegisterLogSchema);

export default CashRegisterLog;
