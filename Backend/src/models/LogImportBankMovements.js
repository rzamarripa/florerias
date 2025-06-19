import mongoose from "mongoose";
const { Schema } = mongoose;

const logImportBankMovementsSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: "cc_company", required: true },
  bankAccount: {
    type: Schema.Types.ObjectId,
    ref: "cc_bank_account",
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: "ac_user" }, // Opcional: si tienes autenticación
  importedAt: { type: Date, default: Date.now },
  fileName: { type: String }, // Opcional: nombre del archivo importado
  count: { type: Number }, // Opcional: cuántos movimientos se importaron
});

const LogImportBankMovements = mongoose.model(
  "log_importBankMovements",
  logImportBankMovementsSchema
);
export { LogImportBankMovements };
