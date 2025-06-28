import mongoose from "mongoose";
const { Schema } = mongoose;

const bankMovementSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: "cc_companies", required: true },
  bankAccount: {
    type: Schema.Types.ObjectId,
    ref: "cc_bank_account",
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  concepto: {
    type: String,
    required: true,
  },
  referencia: {
    type: String,
    required: false,
  },
  cargo: {
    type: Number,
    required: true,
  },
  abono: {
    type: Number,
    required: true,
  },
  saldo: {
    type: Number,
    required: true,
  },
  archivoOriginal: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BankMovement = mongoose.model("cc_bank_movement", bankMovementSchema);

export { BankMovement };
