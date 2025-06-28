import mongoose from "mongoose";
const { Schema } = mongoose;

const logImportBankMovementsSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: "cc_companies", required: true },
  bankAccount: {
    type: Schema.Types.ObjectId,
    ref: "cc_bank_account",
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: "ac_user" },
  importedAt: { type: Date, default: Date.now },
  fileName: { type: String },
  count: { type: Number },
});

const LogImportBankMovements = mongoose.model(
  "log_importBankMovements",
  logImportBankMovementsSchema
);
export { LogImportBankMovements };
