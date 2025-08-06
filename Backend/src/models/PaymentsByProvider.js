import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentsByProviderSchema = new Schema({
  groupingFolio: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return Math.floor(10000 + Math.random() * 90000).toString();
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  providerRfc: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  providerName: {
    type: String,
    required: true,
    trim: true,
  },
  branchName: {
    type: String,
    required: true,
    trim: true,
  },
  companyProvider: {
    type: String,
    required: true,
    trim: true,
  },
  bankNumber: {
    type: String,
    required: true,
    trim: true,
  },
  debitedBankAccount: {
    type: Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  facturas: [{
    type: Schema.Types.ObjectId,
    ref: 'InvoicesPackage'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

paymentsByProviderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const PaymentsByProvider = mongoose.model("cc_payments_by_provider", paymentsByProviderSchema);

export { PaymentsByProvider }; 