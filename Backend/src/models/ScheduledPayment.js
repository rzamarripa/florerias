import mongoose from "mongoose";
const { Schema } = mongoose;

const scheduledPaymentSchema = new Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cc_companies",
    required: true,
    index: true,
  },
  bankAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cc_bank_accounts",
    required: true,
    index: true,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cc_invoices_package",
    required: true,
    index: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cs_user",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["programado", "procesando", "completado", "cancelado", "error"],
    default: "programado",
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

scheduledPaymentSchema.index({ companyId: 1, bankAccountId: 1 });
scheduledPaymentSchema.index({ packageId: 1 }, { unique: true });
scheduledPaymentSchema.index({ status: 1, scheduledDate: 1 });

scheduledPaymentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const ScheduledPayment = mongoose.model("rs_scheduled_payment", scheduledPaymentSchema);

export { ScheduledPayment }; 