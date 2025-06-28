import mongoose from "mongoose";
const { Schema } = mongoose;

const bankAccountSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: "cc_companies",
    required: true,
  },
  bank: {
    type: Schema.Types.ObjectId,
    ref: "cc_bank",
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true,
  },
  clabe: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String,
    trim: true,
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
});

bankAccountSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const BankAccount = mongoose.model("cc_bank_account", bankAccountSchema);

export { BankAccount };
