import mongoose from "mongoose";
const { Schema } = mongoose;

const bankNumberSchema = new Schema({
  bankDebited: {
    type: Schema.Types.ObjectId,
    ref: "cc_bank",
    required: true,
  },
  bankCredited: {
    type: String,
    required: true,
    trim: true,
  },
  bankNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
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

bankNumberSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const BankNumber = mongoose.model("cc_bank_number", bankNumberSchema);

export { BankNumber }; 