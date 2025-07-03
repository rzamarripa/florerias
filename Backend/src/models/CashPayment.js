import mongoose from "mongoose";
const { Schema } = mongoose;

const cashPaymentSchema = new Schema({
    amount: { type: Number, required: true },
    expenseConcept: { type: Schema.Types.ObjectId, ref: "cc_expense_concept", required: true },
    description: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
});

const CashPayment = mongoose.model("cc_cash_payment", cashPaymentSchema);

export { CashPayment }; 